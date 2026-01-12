import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';

const ProjectSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const gradeOrder = { 'H': 1, 'M': 2, 'L': 3 };

  const sortSchedules = (data) => {
    return [...data].sort((a, b) => {
      const getStatusOrder = (item) => {
        if (item.canceled) return 2;
        if (item.irrelevant) return 1;
        return 0;
      };
      const statusA = getStatusOrder(a);
      const statusB = getStatusOrder(b);
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      const gradeA = gradeOrder[a.grade] || 99;
      const gradeB = gradeOrder[b.grade] || 99;
      if (gradeA !== gradeB) {
        return gradeA - gradeB;
      }
      return (a.schedule || '').localeCompare(b.schedule || '');
    });
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'H': return '#E53E3E';
      case 'M': return '#3182CE';
      case 'L': return '#38A169';
      default: return '#A0AEC0';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/data/projectSchedule.json`);
        const data = await response.json();
        const sortedData = sortSchedules(data.schedules || []);
        setSchedules(sortedData);
      } catch (error) {
        console.error('프로젝트 예정 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="xl">📅 프로젝트 예정 데이터 로딩중...</Text>
      </Box>
    );
  }

  const cellStyle = {
    padding: '8px 12px',
    borderBottom: '1px solid #4A5568',
    borderRight: '1px solid #4A5568',
    textAlign: 'center',
    height: '35px',
    verticalAlign: 'middle'
  };

  const canceledCount = schedules.filter(item => item.canceled).length;
  const irrelevantCount = schedules.filter(item => item.irrelevant && !item.canceled).length;
  const activeCount = schedules.length - canceledCount - irrelevantCount;

  return (
    <Box h="100%" display="flex" flexDirection="column" bg="gray.800" p={4}>
      <Text color="white" fontSize="xl" fontWeight="bold" mb={4} textAlign="center">
        📅 프로젝트 예정 (총 {schedules.length}건 | 진행 {activeCount}건 | 무관 {irrelevantCount}건 | 취소 {canceledCount}건)
      </Text>

      <Box flex="1" overflow="auto">
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          tableLayout: 'fixed',
          border: '1px solid #4A5568'
        }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: '#2D3748' }}>
              <th style={{ ...cellStyle, width: '4%', color: '#E2E8F0' }}>NO</th>
              <th style={{ ...cellStyle, width: '14%', color: '#E2E8F0' }}>고객사</th>
              <th style={{ ...cellStyle, width: '35%', color: '#E2E8F0' }}>사업명</th>
              <th style={{ ...cellStyle, width: '6%', color: '#E2E8F0' }}>등급</th>
              <th style={{ ...cellStyle, width: '9%', color: '#E2E8F0' }}>예상일정</th>
              <th style={{ ...cellStyle, width: '10%', color: '#E2E8F0' }}>투입인력</th>
              <th style={{ ...cellStyle, width: '7%', color: '#E2E8F0' }}>무관함</th>
              <th style={{ ...cellStyle, width: '7%', color: '#E2E8F0', borderRight: 'none' }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((item, index) => (
              <tr 
                key={index} 
                style={{ 
                  backgroundColor: item.canceled 
                    ? '#3D2929' 
                    : item.irrelevant 
                      ? '#2D2D3D'
                      : (index % 2 === 0 ? '#1A202C' : '#2D3748'),
                  opacity: item.canceled ? 0.7 : item.irrelevant ? 0.8 : 1
                }}
              >
                <td style={{ 
                  ...cellStyle, 
                  color: '#E2E8F0',
                  textDecoration: item.canceled ? 'line-through' : 'none'
                }}>{index + 1}</td>
                <td style={{ 
                  ...cellStyle, 
                  color: '#E2E8F0', 
                  textAlign: 'left',
                  textDecoration: item.canceled ? 'line-through' : 'none'
                }}>{item.customer}</td>
                <td style={{ 
                  ...cellStyle, 
                  color: '#E2E8F0', 
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textDecoration: item.canceled ? 'line-through' : 'none'
                }} title={item.project}>{item.project}</td>
                <td style={{ ...cellStyle }}>
                  <span style={{
                    backgroundColor: item.canceled ? '#718096' : getGradeColor(item.grade),
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    textDecoration: item.canceled ? 'line-through' : 'none'
                  }}>
                    {item.grade}
                  </span>
                </td>
                <td style={{ 
                  ...cellStyle, 
                  color: '#E2E8F0',
                  textDecoration: item.canceled ? 'line-through' : 'none'
                }}>{item.schedule}</td>
                <td style={{ 
                  ...cellStyle, 
                  color: '#A0AEC0',
                  textDecoration: item.canceled ? 'line-through' : 'none'
                }}>{item.manager}</td>
                <td style={{ ...cellStyle }}>
                  <span style={{
                    backgroundColor: item.irrelevant ? '#805AD5' : '#4A5568',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {item.irrelevant ? 'Y' : 'N'}
                  </span>
                </td>
                <td style={{ 
                  ...cellStyle, 
                  borderRight: 'none'
                }}>
                  <span style={{
                    backgroundColor: item.canceled ? '#E53E3E' : '#38A169',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {item.canceled ? '취소' : '진행'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <Box mt={2} textAlign="center">
        <Text color="gray.500" fontSize="sm">
          🔄 5분마다 데이터 갱신 | 정렬: 정상→무관→취소 → 등급(H→M→L) → 예정일자
        </Text>
      </Box>
    </Box>
  );
};

export default ProjectSchedule;
