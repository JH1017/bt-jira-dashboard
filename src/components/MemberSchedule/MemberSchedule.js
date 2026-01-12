import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';

const MemberSchedule = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/memberSchedule.json');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('인력 일정 데이터 로드 실패:', error);
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
        <Text color="white" fontSize="xl">📆 인력 일정 데이터 로딩중...</Text>
      </Box>
    );
  }

const cellStyle = {
    padding: '4px 2px',
    borderBottom: '1px solid #4A5568',
    borderRight: '1px solid #4A5568',
    textAlign: 'center',
    height: '36px',
    verticalAlign: 'middle',
    fontSize: '15px'
};


  // 팀의 총 프로젝트 행 수 계산
  const getTotalRows = (team) => {
    return team.members.reduce((sum, member) => {
      return sum + Math.max(member.projects.length, 1);
    }, 0);
  };

  const renderTeam = (team, isFirst) => {
    const totalRows = getTotalRows(team);
    const rows = [];
    let isFirstRowOfTeam = true;

    team.members.forEach((member) => {
      const projectCount = Math.max(member.projects.length, 1);

      for (let i = 0; i < projectCount; i++) {
        const project = member.projects[i];
        const isFirstRowOfMember = i === 0;
        const rowIndex = rows.length;

        rows.push(
          <tr key={`${team.name}-${member.name}-${i}`} style={{ backgroundColor: rowIndex % 2 === 0 ? '#1A202C' : '#232D3B' }}>
            {/* 파트 셀 - 팀의 첫 번째 행에만 표시 */}
            {isFirstRowOfTeam && (
              <td 
                rowSpan={totalRows} 
                style={{ 
                  ...cellStyle, 
                  backgroundColor: '#2D3748',
                  color: 'white',
                  fontWeight: 'bold',
                  width: '50px'
                }}
              >
                {team.name}
              </td>
            )}
            {/* 이름 셀 - 멤버의 첫 번째 행에만 표시 */}
            {isFirstRowOfMember && (
              <td 
                rowSpan={projectCount}
                style={{ ...cellStyle, color: '#E2E8F0', width: '70px', textAlign: 'center' }}
              >
                {member.name}
              </td>
            )}
            {/* 프로젝트명 */}
            <td style={{ 
              ...cellStyle, 
              color: '#A0AEC0', 
              width: '140px', 
              textAlign: 'left', 
              paddingLeft: '8px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }} title={project ? project.name : '-'}>
              {project ? project.name : '-'}
            </td>
            {/* 월별 셀 */}
            {months.map((_, monthIndex) => {
              const month = monthIndex + 1;
              const isActive = project && month >= project.start && month <= project.end;
              
              return (
                <td 
                  key={monthIndex} 
                  style={{ 
                    ...cellStyle, 
                    backgroundColor: isActive ? '#5A9FBF' : 'transparent',
                    width: '55px'
                  }}
                  title={isActive ? project.name : ''}
                >
                </td>
              );
            })}
          </tr>
        );

        if (isFirstRowOfTeam) {
          isFirstRowOfTeam = false;
        }
      }
    });

    return rows;
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" bg="gray.800" p={4}>
      <Text color="white" fontSize="xl" fontWeight="bold" mb={4} textAlign="center">
        📆 인력별 프로젝트 투입현황 (2026년)
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
              <th style={{ ...cellStyle, width: '50px', color: '#E2E8F0' }}>파트</th>
              <th style={{ ...cellStyle, width: '70px', color: '#E2E8F0' }}>이름</th>
              <th style={{ ...cellStyle, width: '140px', color: '#E2E8F0' }}>프로젝트</th>
              {months.map((month, index) => (
                <th key={index} style={{ ...cellStyle, width: '55px', color: '#E2E8F0' }}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && renderTeam(data.team1, true)}
            {data && renderTeam(data.team2, false)}
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

export default MemberSchedule;
