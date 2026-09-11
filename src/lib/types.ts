export interface DailyWaveSummary {
  date: string; year: number; month: number; day: number; observationCount: number; validWaveObservationCount: number
  waveHeightMean: number | null; waveHeightP10: number | null; waveHeightP90: number | null
  waterTempMean: number | null; dominantPeriodMean: number | null; averagePeriodMean: number | null; meanWaveDirection: number | null
}
export interface WaveDataset { station: { id: string; name: string; timezone: string }; year: number; units: Record<string, string>; days: DailyWaveSummary[] }
