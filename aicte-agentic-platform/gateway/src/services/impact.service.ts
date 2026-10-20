import { db } from "./db.service";

export interface ImpactMetrics {
  totalApplications: number;
  processedCount: number;
  averageProcessingSeconds: number | null;
  averageProcessingDisplay: string;
  baselineManualMinutes: number;
  baselineMethodology: string;
  isBaselineConfigured: boolean;
  estimatedManualTimeSavedHours: number | null;
  estimatedManualTimeSavedDisplay: string;
  hasSufficientData: boolean;
}

export class ImpactService {
  public static calculateMetrics(): ImpactMetrics {
    const state = db.getState();
    const config = state.config || {
      baselineManualMinutes: 120,
      baselineMethodology: "Standard AICTE manual scrutiny assumption: 120 minutes per institutional pack based on multi-member verification panel guidelines."
    };

    const apps = state.applications || [];
    const totalApplications = apps.length;

    // Filter applications that have been genuinely processed
    const processedApps = apps.filter(
      (a) => a.status === "Needs Review" || a.status === "Approved" || a.status === "Rectification Requested" || a.status === "Escalated"
    );

    const processedCount = processedApps.length;

    if (processedCount === 0) {
      return {
        totalApplications,
        processedCount: 0,
        averageProcessingSeconds: null,
        averageProcessingDisplay: "—",
        baselineManualMinutes: config.baselineManualMinutes,
        baselineMethodology: config.baselineMethodology,
        isBaselineConfigured: true,
        estimatedManualTimeSavedHours: null,
        estimatedManualTimeSavedDisplay: "Not enough data",
        hasSufficientData: false
      };
    }

    // Compute actual processing duration in seconds from timestamps
    let totalDurationSeconds = 0;
    let measuredAppsCount = 0;

    for (const app of processedApps) {
      if (app.submittedAt && app.processedAt) {
        const start = new Date(app.submittedAt).getTime();
        const end = new Date(app.processedAt).getTime();
        if (end >= start) {
          totalDurationSeconds += (end - start) / 1000;
          measuredAppsCount++;
        }
      }
    }

    const avgSeconds = measuredAppsCount > 0 ? totalDurationSeconds / measuredAppsCount : null;
    const avgDisplay = avgSeconds !== null ? `${avgSeconds.toFixed(1)}s` : "—";

    // Estimated manual time saved:
    // (Manual Baseline Minutes - Actual Automated Minutes) * Processed Count
    const manualMinutesPerApp = config.baselineManualMinutes;
    const automatedMinutesPerApp = avgSeconds !== null ? avgSeconds / 60 : 0.1;
    const netSavedMinutesTotal = Math.max(0, (manualMinutesPerApp - automatedMinutesPerApp) * processedCount);
    const savedHours = Number((netSavedMinutesTotal / 60).toFixed(1));

    return {
      totalApplications,
      processedCount,
      averageProcessingSeconds: avgSeconds !== null ? Number(avgSeconds.toFixed(1)) : null,
      averageProcessingDisplay: avgDisplay,
      baselineManualMinutes: config.baselineManualMinutes,
      baselineMethodology: config.baselineMethodology,
      isBaselineConfigured: true,
      estimatedManualTimeSavedHours: savedHours,
      estimatedManualTimeSavedDisplay: `${savedHours} hrs`,
      hasSufficientData: true
    };
  }

  public static updateBaselineConfig(minutes: number, methodology: string) {
    return db.updateConfig({
      baselineManualMinutes: minutes,
      baselineMethodology: methodology
    });
  }
}
