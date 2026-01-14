import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';

const ProjectStatus = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/projectStatus.json');
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
    padding: '8px 4px',
    borderBottom: '1px solid #4A5568',
    borderRight: '1px solid #4A5568',
    textAlign: 'center',
    height: '50px',
    verticalAlign: 'middle',
    minWidth: '60px'
  };

  // 프로젝트명 2줄 표시 (고객사 + 프로젝트명)
  const formatProjectName = (name) => {
    const dashIndex = name.indexOf('-');
    if (dashIndex > 0) {
      const customer = name.substring(0, dashIndex);
      const project = name.substring(dashIndex + 1);
      return { customer, project };
    }
    return { customer: name, project: '' };
  };

  // 멤버가 프로젝트에 할당되었는지 확인
  const isMember = (project, memberName) => {
    return project.members && project.members.includes(memberName);
  };

  // 프로젝트 상태에 따른 스타일
  const getRowStyle = (project, index) => {
    const isCompleted = project.status === 'completed';
    return {
      backgroundColor: isCompleted 
        ? '#1a3a1a'  // 완료: 어두운 녹색 배경
        : (index % 2 === 0 ? '#1A202C' : '#2D3748'),
      opacity: isCompleted ? 0.7 : 1
    };
  };

  // 완료된 프로젝트 수
  const completedCount = data.projects.filter(p => p.status === 'completed').length;
  const activeCount = data.projects.filter(p => p.status !== 'completed').length;

  return (
    <Box h="100%" display="flex" flexDirection="column" bg="gray.800" p={4}>
      <Box display="flex" justifyContent="center" alignItems="center" mb={4} gap={4}>
        <Text color="white" fontSize="xl" fontWeight="bold">
          👨‍💻 프로젝트 투입인력 할당 현황
        </Text>
        <Text color="gray.400" fontSize="sm">
          진행 <Text as="span" color="blue.300" fontWeight="bold">{activeCount}</Text> | 
          완료 <Text as="span" color="green.300" fontWeight="bold">{completedCount}</Text>
        </Text>
      </Box>

      <Box flex="1" overflow="auto">
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          border: '1px solid #4A5568'
        }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ backgroundColor: '#2D3748' }}>
              <th rowSpan={2} style={{ ...cellStyle, width: '150px', color: '#E2E8F0' }}>개발6팀</th>
              {/* 팀장 */}
              <th style={{ ...cellStyle, color: '#E2E8F0', backgroundColor: '#4A5568', width: '60px' }}>
                팀장
              </th>
              {/* 1파트 */}
              <th colSpan={data.team1.length} style={{ ...cellStyle, color: '#E2E8F0', backgroundColor: '#2C5282' }}>1파트</th>
              {/* 2파트 */}
              <th colSpan={data.team2.length} style={{ ...cellStyle, color: '#E2E8F0', backgroundColor: '#276749' }}>2파트</th>
            </tr>
            <tr style={{ backgroundColor: '#2D3748' }}>
              {/* 팀장 이름 */}
              <th style={{ ...cellStyle, color: '#E2E8F0', fontSize: '15px', backgroundColor: '#4A5568', width: '60px' }}>
                {data.teamLeader || '-'}
              </th>
              {/* 1파트 멤버 */}
              {data.team1.map((member, index) => (
                <th key={`t1-${index}`} style={{ ...cellStyle, color: '#E2E8F0', fontSize: '15px', backgroundColor: '#2C5282', width: '60px' }}>
                  {member}
                </th>
              ))}
              {/* 2파트 멤버 */}
              {data.team2.map((member, index) => (
                <th key={`t2-${index}`} style={{ ...cellStyle, color: '#E2E8F0', fontSize: '15px', backgroundColor: '#276749', width: '60px' }}>
                  {member}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.projects.map((project, index) => {
              const isCompleted = project.status === 'completed';
              const { customer, project: projectName } = formatProjectName(project.name);
              
              return (
                <tr key={index} style={getRowStyle(project, index)}>
                  <td style={{ 
                    ...cellStyle, 
                    color: '#E2E8F0', 
                    textAlign: 'left', 
                    paddingLeft: '8px',
                    lineHeight: '1.2',
                    position: 'relative'
                  }} title={project.name}>
                    {/* 완료 표시 배지 */}
                    {isCompleted && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#48BB78',
                        color: 'white',
                        fontSize: '16px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        완료
                      </span>
                    )}
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: isCompleted ? '#68D391' : '#63B3ED',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {customer}
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      color: isCompleted ? '#68D391' : '#A0AEC0',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {projectName.length > 25 ? projectName.substring(0, 25) + '...' : projectName}
                    </div>
                  </td>
                  {/* 팀장 할당 셀 */}
                  <td 
                    style={{ 
                      ...cellStyle, 
                      backgroundColor: isMember(project, data.teamLeader) 
                        ? (isCompleted ? '#276749' : '#ECC94B') 
                        : 'transparent'
                    }}
                  />
                  {/* 1파트 멤버 할당 */}
                  {data.team1.map((member, mIndex) => (
                    <td 
                      key={`t1-${mIndex}`} 
                      style={{ 
                        ...cellStyle, 
                        backgroundColor: isMember(project, member) 
                          ? (isCompleted ? '#276749' : '#ECC94B') 
                          : 'transparent'
                      }}
                    />
                  ))}
                  {/* 2파트 멤버 할당 */}
                  {data.team2.map((member, mIndex) => (
                    <td 
                      key={`t2-${mIndex}`} 
                      style={{ 
                        ...cellStyle, 
                        backgroundColor: isMember(project, member) 
                          ? (isCompleted ? '#276749' : '#ECC94B') 
                          : 'transparent'
                      }}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>

      <Box mt={2} display="flex" justifyContent="center" gap={4}>
        <Text color="gray.500" fontSize="sm">
          🟨 진행중 | 🟩 완료
        </Text>
        <Text color="gray.500" fontSize="sm">
          🔄 5분마다 데이터 갱신
        </Text>
      </Box>
    </Box>
  );
};

export default ProjectStatus;