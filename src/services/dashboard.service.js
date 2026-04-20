// 看板数据服务 — 核心计算引擎 (async 版)
const videoRepo = require('../repository/video.repo');
const livestreamRepo = require('../repository/livestream.repo');
const targetRepo = require('../repository/target.repo');
const dashboardRepo = require('../repository/dashboard.repo');
const { getRecentWeeks } = require('../utils/date.helper');

class DashboardService {

  async getOverview(brand, week) {
    const [videoStats, newVideos, liveStats, targets] = await Promise.all([
      videoRepo.getWeeklyStats(brand, week),
      videoRepo.getNewVideosByWeek(brand, week),
      livestreamRepo.getWeeklyStats(brand, week),
      targetRepo.getByWeek(brand, week),
    ]);

    const newVideoGmv = newVideos.reduce((sum, v) => sum + (v.gmv || 0), 0);
    const newVideoCount = newVideos.length;
    const liveGmv = liveStats?.total_live_gmv || 0;
    const overallTarget = targets.find(t => t.dimension === 'overall');

    const totalVideoGmv = videoStats?.total_gmv || 0;
    const totalVideoCount = videoStats?.video_count || 0;
    const gmvRatio = liveGmv > 0 ? totalVideoGmv / liveGmv : 0;
    const newVideoGmvRatio = totalVideoGmv > 0 ? newVideoGmv / totalVideoGmv : 0;

    const refDate = new Date().toISOString().split('T')[0];
    const effectiveCount = await dashboardRepo.getEffectiveCount(brand, week, refDate);

    const targetGmvRatio = overallTarget?.target_gmv_ratio_all || 0;
    const targetGmv = liveGmv * targetGmvRatio;
    const completionRate = targetGmv > 0 ? (totalVideoGmv / targetGmv) * 100 : 0;
    const targetNewVideoRatio = overallTarget?.target_gmv_ratio_new || 0;

    return {
      week, brand,
      video: { total_count: totalVideoCount, total_gmv: totalVideoGmv, new_count: newVideoCount, new_gmv: newVideoGmv, effective_count: effectiveCount },
      livestream: { live_count: liveStats?.live_count || 0, total_gmv: liveGmv },
      target: { gmv_ratio: gmvRatio, target_gmv_ratio: targetGmvRatio, target_gmv, new_video_gmv_ratio: newVideoGmvRatio, target_new_video_ratio: targetNewVideoRatio, completion_rate: completionRate },
      target_raw: overallTarget || null,
    };
  }

  async getSourceAnalysis(brand, week) {
    const [sourceStats, targets] = await Promise.all([
      dashboardRepo.getSourceWeeklyStats(brand, week),
      targetRepo.getByWeek(brand, week),
    ]);

    const sourceNames = { internal: '内部', ito: 'ITO', external: '外部', aigc: 'AIGC', other: '其他' };
    const allVideoGmv = sourceStats.reduce((s, r) => s + (r.total_gmv || 0), 0);

    const internalStats = sourceStats.filter(s => s.source === 'internal' || s.source === 'ito');
    const internalGmv = internalStats.reduce((s, r) => s + (r.total_gmv || 0), 0);
    const internalCount = internalStats.reduce((s, r) => s + (r.video_count || 0), 0);

    const externalStats = sourceStats.find(s => s.source === 'external') || {};
    const externalGmv = externalStats.total_gmv || 0;
    const externalCount = externalStats.video_count || 0;

    return {
      week, brand,
      sources: sourceStats.map(s => ({
        source: s.source, name: sourceNames[s.source] || s.source,
        video_count: s.video_count || 0, total_gmv: s.total_gmv || 0,
        avg_gmv: s.avg_gmv || 0, gmv_ratio: allVideoGmv > 0 ? (s.total_gmv || 0) / allVideoGmv : 0,
      })),
      groups: [
        { source: 'internal', name: '内部(含ITO)', video_count: internalCount, total_gmv: internalGmv, avg_gmv: internalCount > 0 ? internalGmv / internalCount : 0, gmv_ratio: allVideoGmv > 0 ? internalGmv / allVideoGmv : 0, target: targets.find(t => t.dimension === 'internal') || null },
        { source: 'external', name: '外部', video_count: externalCount, total_gmv: externalGmv, avg_gmv: externalCount > 0 ? externalGmv / externalCount : 0, gmv_ratio: allVideoGmv > 0 ? externalGmv / allVideoGmv : 0, target: targets.find(t => t.dimension === 'external') || null },
      ],
      others: sourceStats.filter(s => s.source === 'aigc' || s.source === 'other').map(s => ({
        source: s.source, name: sourceNames[s.source] || s.source,
        video_count: s.video_count || 0, total_gmv: s.total_gmv || 0,
        gmv_ratio: allVideoGmv > 0 ? (s.total_gmv || 0) / allVideoGmv : 0,
      })),
    };
  }

  async getFormatAnalysis(brand, week) {
    const stats = await dashboardRepo.getFormatWeeklyStats(brand, week);
    return { week, brand, formats: stats };
  }

  async getRunnerStats(brand, quarter) {
    const videos = await videoRepo.getByQuarter(brand, quarter);
    const internal = videos.filter(v => v.source === 'internal' || v.source === 'ito');
    const external = videos.filter(v => v.source === 'external');
    const countRunner = (arr, threshold) => arr.filter(v => v.gmv >= threshold).length;

    return {
      brand, quarter,
      internal: { name: '内部(含ITO)', count_g50k: countRunner(internal, 50000), count_g10k: countRunner(internal, 10000), total_count: internal.length },
      external: { name: '外部', count_g50k: countRunner(external, 50000), count_g10k: countRunner(external, 10000), total_count: external.length },
      total: { count_g50k: countRunner(videos, 50000), count_g10k: countRunner(videos, 10000), total_count: videos.length },
    };
  }

  async getTrend(brand, weekCount = 8) {
    const recentWeeks = getRecentWeeks(weekCount).reverse();
    const [trend] = await Promise.all([dashboardRepo.getWeeklyTrend(brand, recentWeeks)]);

    const livePromises = recentWeeks.map(async w => {
      const stats = await livestreamRepo.getWeeklyStats(brand, w);
      return { week: w, total_live_gmv: stats?.total_live_gmv || 0 };
    });
    const liveTrend = await Promise.all(livePromises);

    return recentWeeks.map(w => {
      const v = trend.find(t => t.data_week === w) || {};
      const l = liveTrend.find(t => t.week === w) || {};
      return {
        week: w, video_count: v.video_count || 0, video_gmv: v.total_gmv || 0,
        live_gmv: l.total_live_gmv || 0,
        gmv_ratio: l.total_live_gmv > 0 ? (v.total_gmv || 0) / l.total_live_gmv : 0,
        impressions: v.total_impressions || 0, cost: v.total_cost || 0, avg_roi: v.avg_roi || 0,
      };
    });
  }

  async getAvailableWeeks(brand) {
    return videoRepo.getAvailableWeeks(brand);
  }
}

module.exports = new DashboardService();
