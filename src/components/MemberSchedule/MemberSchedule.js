import { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';

const MemberSchedule = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (!data) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="xl">데이터를 불러올 수 없습니다.</Text>
      </Box>
    );
  }

  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const currentMonth = new Date().getMonth() + 1; // 1~12
  const currentDay = new Date().getDate();
  const activeColor = '#5A9FBF';

  const cellStyle = {
    padding: '6px 8px',
    borderBottom: '1px solid #4A5568',
    borderRight: '1px solid #4A5568',
    textAlign: 'center',
    height: '36px',
    verticalAlign: 'middle',
    position: 'relative'
  };

  // 현재 월 오른쪽에 빨간 선 표시 여부
  const shouldShowRedLine = (monthIndex) => {
    return monthIndex + 1 === currentMonth;
  };

  // 빨간 선 위치 계산 (일 기준 퍼센트)
  const getRedLinePosition = () => {
    const daysInMonth = new Date(2026, currentMonth, 0).getDate();
    return (currentDay / daysInMonth) * 100;
  };

  const getTotalRows = (team) => {
    return team.members.reduce((sum, member) => sum + Math.max(member.projects.length, 1), 0);
  };

  const renderTeam = (team, teamName) => {
    const totalRows = getTotalRows(team);
    const rows = [];
    let isFirstMemberOfTeam = true;

    team.members.forEach((member, memberIndex) => {
      const projectCount = Math.max(member.projects.length, 1);

      member.projects.forEach((project, projectIndex) => {
        const isFirstRowOfMember = projectIndex === 0;

        rows.push(
          <tr key={`${teamName}-${memberIndex}-${projectIndex}`} style={{ backgroundColor: '#1A202C' }}>
            {/* 파트 */}
            {isFirstMemberOfTeam && isFirstRowOfMember && (
              <td rowSpan={totalRows} style={{ 
                ...cellStyle, 
                backgroundColor: teamName === 'team1' ? '#2C5282' : '#276749',
                color: '#E2E8F0',
                fontWeight: 'bold',
                width: '60px'
              }}>
                {team.name}
              </td>
            )}
            {/* 이름 */}
            {isFirstRowOfMember && (
              <td rowSpan={projectCount} style={{ 
                ...cellStyle, 
                color: '#E2E8F0',
                backgroundColor: '#2D3748',
                width: '70px'
              }}>
                {member.name}
              </td>
            )}
            {/* 프로젝트명 */}
            <td style={{ 
              ...cellStyle, 
              color: '#A0AEC0',
              textAlign: 'left',
              paddingLeft: '10px',
              width: '200px',
              fontSize: '15px'
            }}>
              {project.name || '-'}
            </td>
            {/* 월별 셀 */}
            {months.map((_, monthIndex) => {
              const month = monthIndex + 1;
              const isActive = project.start <= month && month <= project.end;
              const showRedLine = shouldShowRedLine(monthIndex);
              
              return (
                <td 
                  key={monthIndex} 
                  style={{ 
                    ...cellStyle,
                    backgroundColor: isActive ? activeColor : 'transparent',
                    width: '50px',
                    position: 'relative'
                  }}
                >
                  {/* 현재 날짜 빨간 선 */}
                  {showRedLine && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: 0,
                      width: '2px',
                      backgroundColor: '#E53E3E',
                      zIndex: 10
                    }} />
                  )}
                </td>
              );
            })}
          </tr>
        );

        if (isFirstMemberOfTeam && isFirstRowOfMember) {
          isFirstMemberOfTeam = false;
        }
      });

      // 프로젝트가 없는 멤버
      if (member.projects.length === 0) {
        rows.push(
          <tr key={`${teamName}-${memberIndex}-empty`} style={{ backgroundColor: '#1A202C' }}>
            {isFirstMemberOfTeam && (
              <td rowSpan={totalRows} style={{ 
                ...cellStyle, 
                backgroundColor: teamName === 'team1' ? '#2C5282' : '#276749',
                color: '#E2E8F0',
                fontWeight: 'bold',
                width: '60px'
              }}>
                {team.name}
              </td>
            )}
            <td style={{ ...cellStyle, color: '#E2E8F0', backgroundColor: '#2D3748', width: '70px' }}>
              {member.name}
            </td>
            <td style={{ ...cellStyle, color: '#A0AEC0', width: '200px' }}>-</td>
            {months.map((_, monthIndex) => {
              const showRedLine = shouldShowRedLine(monthIndex);
              return (
                <td key={monthIndex} style={{ ...cellStyle, width: '50px', position: 'relative' }}>
                  {showRedLine && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${getRedLinePosition()}%`,
                      width: '2px',
                      backgroundColor: '#E53E3E',
                      zIndex: 10
                    }} />
                  )}
                </td>
              );
            })}
          </tr>
        );
        isFirstMemberOfTeam = false;
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
          border: '1px solid #4A5568'
        }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            <tr style={{ backgroundColor: '#2D3748' }}>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '60px' }}>파트</th>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '70px' }}>이름</th>
              <th style={{ ...cellStyle, color: '#E2E8F0', width: '200px' }}>프로젝트</th>
              {months.map((month, index) => {
                const showRedLine = shouldShowRedLine(index);
                return (
                  <th 
                    key={index} 
                    style={{ 
                      ...cellStyle, 
                      color: currentMonth === index + 1 ? '#FC8181' : '#E2E8F0',
                      fontWeight: currentMonth === index + 1 ? 'bold' : 'normal',
                      width: '50px',
                      position: 'relative'
                    }}
                  >
                    {month}
                    {/* 헤더에도 빨간 선 */}
                    {showRedLine && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: '2px',
                        backgroundColor: '#E53E3E',
                        zIndex: 10
                      }} />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.team1 && renderTeam(data.team1, 'team1')}
            {data.team2 && renderTeam(data.team2, 'team2')}
          </tbody>
        </table>
      </Box>

      <Box mt={2} display="flex" justifyContent="center" gap={4}>
        <Text color="gray.400" fontSize="sm">
          📍 오늘: {currentMonth}월 {currentDay}일
        </Text>
        <Text color="gray.500" fontSize="sm">
          🔄 5분마다 데이터 갱신
        </Text>
      </Box>
    </Box>
  );
};

export default MemberSchedule;
