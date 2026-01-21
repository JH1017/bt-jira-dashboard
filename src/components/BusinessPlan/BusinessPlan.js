import { useState, useEffect } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';

const BusinessPlan = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/businessPlan.json');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('사업계획 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="xl">📊 사업계획 데이터 로딩중...</Text>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="xl">데이터를 불러올 수 없습니다.</Text>
      </Box>
    );
  }

  const cellStyle = {
    padding: '10px 12px',
    borderBottom: '1px solid #4A5568',
    borderRight: '1px solid #4A5568',
    verticalAlign: 'top'
  };

  // 솔루션별 색상
  const getSolutionColor = (solution) => {
    const upper = solution?.toUpperCase() || '';
    if (upper.includes('ARGO') && upper.includes('RSM')) return '#9F7AEA'; // 보라
    if (upper.includes('ARGO')) return '#4299E1'; // 파랑
    if (upper.includes('RSM')) return '#48BB78'; // 녹색
    return '#A0AEC0';
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" bg="gray.800" p={4}>
      {/* 헤더 */}
      <Box textAlign="center" mb={4}>
        <Text color="white" fontSize="xl" fontWeight="bold">
          📊 {data.title}
        </Text>
        <Text color="cyan.300" fontSize="md">[{data.period}]</Text>
      </Box>

      {/* 테이블 */}
      <Box flex="1" overflow="auto">
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          border: '1px solid #4A5568'
        }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: '#2D3748' }}>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '50px', textAlign: 'center' }}>No.</th>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '100px', textAlign: 'center' }}>고객사</th>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '100px', textAlign: 'center' }}>해당 솔루션</th>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '120px', textAlign: 'center' }}>
                <div>ARGO : 상담석 수</div>
                <div style={{ fontSize: '12px', color: '#A0AEC0' }}>RSM : Agent 설치 수</div>
              </th>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '120px', textAlign: 'center' }}>예상일자</th>
              <th style={{ ...cellStyle, color: '#E2E8F0', textAlign: 'center' }}>진행현황</th>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '250px', textAlign: 'center' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {data.plans.map((plan, index) => (
              <tr 
                key={plan.no} 
                style={{ 
                  backgroundColor: index % 2 === 0 ? '#1A202C' : '#2D3748'
                }}
              >
                {/* No */}
                <td style={{ ...cellStyle, color: '#E2E8F0', textAlign: 'center', fontWeight: 'bold' }}>
                  {plan.no}
                </td>
                {/* 고객사 */}
                <td style={{ ...cellStyle, color: '#63B3ED', textAlign: 'center', fontWeight: 'bold' }}>
                  {plan.customer}
                </td>
                {/* 솔루션 */}
                <td style={{ 
                  ...cellStyle, 
                  textAlign: 'center',
                  color: getSolutionColor(plan.solution),
                  fontWeight: 'bold'
                }}>
                  {plan.solution}
                </td>
                {/* 수량 */}
                <td style={{ ...cellStyle, color: '#F6E05E', textAlign: 'center', fontWeight: 'bold' }}>
                  {plan.quantity}
                </td>
                {/* 예상일자 */}
                <td style={{ ...cellStyle, color: '#FC8181', textAlign: 'center' }}>
                  {plan.expectedDate}
                </td>
                {/* 진행현황 */}
                <td style={{ ...cellStyle, color: '#E2E8F0' }}>
                  {plan.progress.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      {plan.progress.length > 1 ? `${idx + 1}. ` : ''}{item}
                    </div>
                  ))}
                </td>
                {/* 비고 */}
                <td style={{ ...cellStyle, color: '#A0AEC0', fontSize: '14px' }}>
                  {plan.remarks || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* 범례 */}
      <Flex mt={3} justifyContent="center" gap={6}>
        <Flex alignItems="center" gap={2}>
          <Box w="12px" h="12px" bg="#4299E1" borderRadius="sm" />
          <Text color="gray.400" fontSize="sm">ARGO</Text>
        </Flex>
        <Flex alignItems="center" gap={2}>
          <Box w="12px" h="12px" bg="#48BB78" borderRadius="sm" />
          <Text color="gray.400" fontSize="sm">RSM</Text>
        </Flex>
        <Flex alignItems="center" gap={2}>
          <Box w="12px" h="12px" bg="#9F7AEA" borderRadius="sm" />
          <Text color="gray.400" fontSize="sm">ARGO+RSM</Text>
        </Flex>
        <Text color="gray.500" fontSize="sm">🔄 5분마다 데이터 갱신</Text>
      </Flex>
    </Box>
  );
};

export default BusinessPlan;
