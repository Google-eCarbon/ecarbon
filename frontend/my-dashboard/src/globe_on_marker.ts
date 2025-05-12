export const getMarkerColor = (carbonEmission: number): string => {
  if (carbonEmission < 1) return '#34d399'; // 매우 낮음 - 연한 녹색
  if (carbonEmission < 2) return '#10b981'; // 낮음 - 녹색
  if (carbonEmission < 3) return '#059669'; // 보통 - 진한 녹색
  if (carbonEmission < 4) return '#047857'; // 높음 - 매우 진한 녹색
  return '#ef4444'; // 매우 높음 - 빨간색
};
