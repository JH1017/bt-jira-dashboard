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
        <Text color="white" fontSize="2xl">📊 사업계획 데이터 로딩중...</Text>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="2xl">데이터를 불러올 수 없습니다.</Text>
      </Box>
    );
  }

  // 제품명 렌더링 (ARGO: 녹색, RSM: 파란색)
  const renderProducts = (products) => {
    const upper = products.toUpperCase();
    const hasArgo = upper.includes('ARGO');
    const hasRsm = upper.includes('RSM');

    if (hasArgo && hasRsm) {
      return (
        <Flex gap={2} justifyContent="center" flexWrap="wrap">
          <Box bg="#48BB78" color="white" px={3} py={1} borderRadius="md" fontSize="20px" fontWeight="bold">
            ARGO
          </Box>
          <Box bg="#4299E1" color="white" px={3} py={1} borderRadius="md" fontSize="20px" fontWeight="bold">
            RSM
          </Box>
        </Flex>
      );
    } else if (hasArgo) {
      return (
        <Box bg="#48BB78" color="white" px={3} py={1} borderRadius="md" fontSize="20px" fontWeight="bold" display="inline-block">
          ARGO
        </Box>
      );
    } else if (hasRsm) {
      return (
        <Box bg="#4299E1" color="white" px={3} py={1} borderRadius="md" fontSize="20px" fontWeight="bold" display="inline-block">
          RSM
        </Box>
      );
    } else {
      return (
        <Box bg="gray.500" color="white" px={3} py={1} borderRadius="md" fontSize="20px" display="inline-block">
          {products}
        </Box>
      );
    }
  };

  const cellStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid #4A5568',
    borderRight: '1px solid #4A5568',
    verticalAlign: 'middle',
    fontSize: '20px'
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" bg="gray.800" p={6}>
      {/* 헤더 */}
      <Box mb={4} textAlign="center">
        <Text color="white" fontSize="28px" fontWeight="bold">
          {data.title}
        </Text>
        <Text color="gray.400" fontSize="md" mt={1}>
          기준: {data.period}
        </Text>
      </Box>

      {/* 테이블 */}
      <Box flex="1" overflow="auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #4A5568' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: '#2D3748' }}>
              <th style={{ ...cellStyle, width: '14%', color: '#E2E8F0', textAlign: 'center', fontSize: '25px' }}>고객사</th>
              <th style={{ ...cellStyle, width: '14%', color: '#E2E8F0', textAlign: 'center', fontSize: '25px' }}>제품</th>
              <th style={{ ...cellStyle, width: '10%', color: '#E2E8F0', textAlign: 'center', fontSize: '25px' }}>수량</th>
              <th style={{ ...cellStyle, width: '14%', color: '#E2E8F0', textAlign: 'center', fontSize: '25px' }}>예상시기</th>
              <th style={{ ...cellStyle, width: '32%', color: '#E2E8F0', textAlign: 'center', fontSize: '25px' }}>진행현황</th>
              <th style={{ ...cellStyle, width: '16%', color: '#E2E8F0', textAlign: 'center', fontSize: '25px', borderRight: 'none' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {data.plans.map((plan, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#1A202C' : '#2D3748' }}>
                {/* 고객사 */}
                <td style={{ ...cellStyle, color: '#63B3ED', textAlign: 'center', fontWeight: 'bold', fontSize: '25px' }}>
                  {plan.customer}
                </td>
                {/* 제품 */}
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  {renderProducts(plan.products)}
                </td>
                {/* 수량 */}
                <td style={{ ...cellStyle, color: '#F6E05E', textAlign: 'center', fontWeight: 'bold', fontSize: '23px' }}>
                  {plan.quantity}
                </td>
                {/* 예상시기 */}
                <td style={{ ...cellStyle, color: '#E2E8F0', textAlign: 'center', fontSize: '23px' }}>
                  {plan.expectedDate}
                </td>
                {/* 진행현황 */}
                <td style={{ ...cellStyle, color: '#A0AEC0', textAlign: 'left', padding: '12px 16px' }}>
                  {plan.progress && plan.progress.filter(p => p && p.trim()).length > 0 ? (
                    plan.progress.filter(p => p && p.trim()).map((item, idx) => (
                      <Box key={idx} mb={1} fontSize="22px" lineHeight="1.4">
                        • {item}
                      </Box>
                    ))
                  ) : (
                    <Text color="gray.500">-</Text>
                  )}
                </td>
                {/* 비고 */}
                <td style={{ ...cellStyle, color: '#CBD5E0', textAlign: 'left', borderRight: 'none', fontSize: '20px' }}>
                  {plan.remarks && plan.remarks.trim() ? plan.remarks : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* 하단 범례 */}
      <Flex mt={4} justifyContent="center" alignItems="center" gap={6}>
        <Flex alignItems="center" gap={2}>
          <Box w="20px" h="20px" bg="#48BB78" borderRadius="md" />
          <Text color="gray.300" fontSize="md">ARGO</Text>
        </Flex>
        <Flex alignItems="center" gap={2}>
          <Box w="20px" h="20px" bg="#4299E1" borderRadius="md" />
          <Text color="gray.300" fontSize="md">RSM</Text>
        </Flex>
        <Text color="gray.500" fontSize="sm" ml={4}>
          🔄 5분마다 데이터 갱신
        </Text>
      </Flex>
    </Box>
  );
};

export default BusinessPlan;
