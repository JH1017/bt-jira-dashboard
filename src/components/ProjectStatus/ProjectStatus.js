import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';

const ProjectStatus = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/data/projectStatus.json`);
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('프로젝트 현황 데이터 로드 실패:', error);
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
        <Text color="white" fontSize="xl">👨‍💻 프로젝트 현황 데이터 로딩중...</Text>
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
    padding: '8px 12px',
    borderBottom: '1px solid #4A5568',
    borderRight: '1px solid #4A5568',
    textAlign: 'center',
    height: '40px',
    verticalAlign: 'middle'
  };

  // 프로젝트명 축약
  const shortenName = (name) => {
    const dashIndex = name.indexOf('-');
    if (dashIndex > 0) {
      const customerName = name.substring(0, dashIndex);
      return customerName.length > 10 ? customerName.substring(0, 10) + '...' : customerName + '...';
    }
    return name.length > 10 ? name.substring(0, 10) + '...' : name;
  };

  // 멤버가 프로젝트에 할당되었는지 확인
  const isMember = (project, memberName) => {
    return project.members && project.members.includes(memberName);
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" bg="gray.800" p={4}>
      <Text color="white" fontSize="xl" fontWeight="bold" mb={4} textAlign="center">
        👨‍💻 프로젝트 투입인력 할당 현황
      </Text>

      <Box flex="1" overflow="auto">
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          border: '1px solid #4A5568'
        }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: '#2D3748' }}>
              <th rowSpan={2} style={{ ...cellStyle, width: '120px', color: '#E2E8F0' }}>개발6팀</th>
              <th colSpan={data.team1.length} style={{ ...cellStyle, color: '#E2E8F0', backgroundColor: '#2C5282' }}>1파트</th>
              <th colSpan={data.team2.length} style={{ ...cellStyle, color: '#E2E8F0', backgroundColor: '#276749' }}>2파트</th>
            </tr>
            <tr style={{ backgroundColor: '#2D3748' }}>
              {data.team1.map((member, index) => (
                <th key={`t1-${index}`} style={{ ...cellStyle, color: '#E2E8F0', fontSize: '13px', backgroundColor: '#2C5282' }}>
                  {member}
                </th>
              ))}
              {data.team2.map((member, index) => (
                <th key={`t2-${index}`} style={{ ...cellStyle, color: '#E2E8F0', fontSize: '13px', backgroundColor: '#276749' }}>
                  {member}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.projects.map((project, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#1A202C' : '#2D3748' }}>
                <td style={{ ...cellStyle, color: '#E2E8F0', textAlign: 'left', paddingLeft: '8px' }} title={project.name}>
                  {shortenName(project.name)}
                </td>
                {data.team1.map((member, mIndex) => (
                  <td 
                    key={`t1-${mIndex}`} 
                    style={{ 
                      ...cellStyle, 
                      backgroundColor: isMember(project, member) ? '#ECC94B' : 'transparent'
                    }}
                  />
                ))}
                {data.team2.map((member, mIndex) => (
                  <td 
                    key={`t2-${mIndex}`} 
                    style={{ 
                      ...cellStyle, 
                      backgroundColor: isMember(project, member) ? '#ECC94B' : 'transparent'
                    }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <Box mt={2} textAlign="center">
        <Text color="gray.500" fontSize="sm">
          🔄 5분마다 데이터 갱신
        </Text>
      </Box>
    </Box>
  );
};

export default ProjectStatus;
