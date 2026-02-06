import { useState, useEffect } from 'react';
import { Box, Text, Flex, Badge, Spinner } from '@chakra-ui/react';
import jiraClient from '../../services/jiraApi';
import CustomerIssuesModal from './CustomerIssuesModal';

const CustomerStats = () => {
  const [stats, setStats] = useState({});
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ⭐ 모달 상태
  const [modalState, setModalState] = useState({
    isOpen: false,
    customerName: '',
    filter: 'total',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('=== CustomerStats 데이터 로드 시작 ===');
        
        const response = await jiraClient.get('/rest/api/2/search', {
          params: {
            jql: `project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀)) AND duedate > 2026-01-01 ORDER BY createdDate DESC`,
            maxResults: 200,
            fields: 'summary,priority,assignee,status,issuetype,created,duedate,customfield_11517,customfield_10402,components',
          },
        });

        const data = response.data.issues.map(issue => {
          const getCustomerName = (fields) => {
            if (fields.customfield_10402) {
              if (fields.customfield_10402.child && fields.customfield_10402.child.value) {
                return fields.customfield_10402.child.value;
              }
              if (fields.customfield_10402.value) {
                return fields.customfield_10402.value;
              }
            }
            if (fields.components && fields.components.length > 0) {
              return fields.components[0].name;
            }
            if (fields.summary) {
              const match = fields.summary.match(/^\[(.*?)\]/);
              if (match) return match[1];
            }
            return '미분류';
          };

          const calculateDaysFromCreated = (createdDate) => {
            if (!createdDate) return 0;
            const created = new Date(createdDate);
            const now = new Date();
            const diffTime = Math.abs(now - created);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          };

          const calculateDelay = (dueDate) => {
            if (!dueDate) return { isDelayed: false, delayDays: 0 };
            const due = new Date(dueDate);
            const now = new Date();
            due.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);
            if (now > due) {
              const diffTime = now - due;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return { isDelayed: true, delayDays: diffDays };
            }
            return { isDelayed: false, delayDays: 0 };
          };

          // ✅ 완료 여부를 먼저 판단
          const statusLower = (issue.fields.status?.name || '').toLowerCase();
          const isCompleted = ['resolved', 'closed', '완료', 'done'].includes(statusLower);

          // ✅ 완료되지 않은 경우에만 지연 계산
          const delay = !isCompleted && issue.fields.duedate 
            ? calculateDelay(issue.fields.duedate) 
            : { isDelayed: false, delayDays: 0 };

          return {
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status?.name || '상태없음',
            customer: getCustomerName(issue.fields),
            daysFromCreated: calculateDaysFromCreated(issue.fields.created),
            isDelayed: delay.isDelayed,
            delayDays: delay.delayDays,
            isCompleted,  // ✅ 추가
            priority: issue.fields.priority?.name || 'Major',
            assignee: issue.fields.assignee?.displayName || '미지정',
            srmStatus: issue.fields.customfield_11517?.value || '-',
            type: issue.fields.issuetype?.name || 'Task',
            createdDate: issue.fields.created ? new Date(issue.fields.created).toISOString().split('T')[0] : '-',
            dueDate: issue.fields.duedate || '미설정',
          };
        });
        
        console.log('📊 받은 전체 이슈 (완료 포함):', data.length);
        
        setIssues(data);
        
        const customerStats = {};
        
        data.forEach((issue) => {
          const customer = issue.customer || '미분류';
          
          if (!customerStats[customer]) {
            customerStats[customer] = {
              total: 0,
              inProgress: 0,
              completed: 0,
              delayed: 0,
              totalDays: 0,
            };
          }
          
          const stat = customerStats[customer];
          stat.total++;
          stat.totalDays += issue.daysFromCreated || 0;
          
          // ✅ isCompleted 속성 사용
          if (issue.isCompleted) {
            stat.completed++;
          } else {
            stat.inProgress++;
          }
          
          // ✅ 완료되지 않은 경우에만 지연 체크
          if (issue.isDelayed && !issue.isCompleted) {
            stat.delayed++;
          }
        });
        
        setStats(customerStats);
        
        Object.entries(customerStats).forEach(([customer, stat]) => {
          console.log(`${customer}: 총 ${stat.total}건 (진행 ${stat.inProgress}, 완료 ${stat.completed}, 지연 ${stat.delayed})`);
        });
        
      } catch (error) {
        console.error('데이터 로드 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ⭐ 모달 열기 함수
  const handleOpenModal = (customerName, filter = 'total') => {
    setModalState({
      isOpen: true,
      customerName,
      filter,
    });
  };

  // ⭐ 모달 닫기 함수
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      customerName: '',
      filter: 'total',
    });
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="gray.900">
        <Spinner size="xl" color="blue.500" />
        <Text ml={4} color="white" fontSize="xl">로딩 중...</Text>
      </Flex>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <Box minH="100vh" bg="gray.900" p={6}>
        <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
          <Text color="gray.400" fontSize="xl">📊 집계할 데이터가 없습니다</Text>
        </Box>
      </Box>
    );
  }

  const rankedStats = Object.entries(stats)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([customer, stat], index) => ({
      rank: index + 1,
      customer,
      ...stat,
    }));

  const totalStats = rankedStats.reduce(
    (acc, stat) => ({
      total: acc.total + stat.total,
      inProgress: acc.inProgress + stat.inProgress,
      completed: acc.completed + stat.completed,
      delayed: acc.delayed + stat.delayed,
      totalDays: acc.totalDays + stat.totalDays,
    }),
    { total: 0, inProgress: 0, completed: 0, delayed: 0, totalDays: 0 }
  );

  const avgDaysTotal = totalStats.total > 0 ? Math.round(totalStats.totalDays / totalStats.total) : 0;
  const completionRateTotal = totalStats.total > 0 ? Math.round((totalStats.completed / totalStats.total) * 100) : 0;

  return (
    <Box minH="100vh" bg="gray.900" p={4}>
      {/* 헤더 */}
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="3xl" fontWeight="bold" color="white">
          📊 고객사별 이슈 집계
        </Text>
        <Flex align="center" gap={3} fontSize="md" color="gray.400">
          <Text>전체 {issues.length}건</Text>
          <Text>|</Text>
          <Text>{Object.keys(stats).length}개사</Text>
          <Text>|</Text>
          <Text fontSize="sm">{new Date().toLocaleTimeString('ko-KR')}</Text>
        </Flex>
      </Flex>

      {/* 테이블 */}
      <Box 
        bg="gray.800" 
        borderRadius="lg" 
        overflow="hidden"
        maxH="calc(100vh - 180px)"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#2D3748',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#4A5568',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#718096',
          },
        }}
      >
        {/* 헤더 */}
        <Flex 
          bg="gray.700" 
          px={4}
          py={3}
          fontWeight="bold" 
          color="gray.300" 
          fontSize="md"
          borderBottom="2px solid"
          borderColor="gray.600"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Box w="6%" textAlign="center">순위</Box>
          <Box w="25%">고객사명</Box>
          <Box w="10%" textAlign="center">총건수</Box>
          <Box w="15%" textAlign="center">📝 진행</Box>
          <Box w="15%" textAlign="center">✅ 완료</Box>
          <Box w="15%" textAlign="center">🚨 지연</Box>
          <Box w="12%" textAlign="center">평균일</Box>
          <Box w="10%" textAlign="center">완료율</Box>
        </Flex>

        {/* 바디 */}
        {rankedStats.map(({ rank, customer, total, inProgress, completed, delayed, totalDays }, index) => {
          const avgDays = total > 0 ? Math.round(totalDays / total) : 0;
          const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

          let rowBg = index % 2 === 0 ? 'gray.800' : 'gray.850';
          if (rank === 1) rowBg = 'blue.950';
          else if (rank === 2) rowBg = 'gray.750';
          else if (rank === 3) rowBg = 'purple.950';

          return (
            <Flex
              key={customer}
              px={4}
              py={3}
              bg={rowBg}
              borderBottom="1px solid"
              borderColor="gray.700"
              borderLeft={delayed > 0 ? '4px solid' : 'none'}
              borderLeftColor={delayed > 0 ? 'red.500' : 'transparent'}
              _hover={{ bg: 'gray.700' }}
              alignItems="center"
              fontSize="md"
            >
              {/* 순위 */}
              <Box w="6%" textAlign="center">
                <Text 
                  color={rank <= 3 ? 'yellow.400' : 'gray.500'} 
                  fontSize="xl" 
                  fontWeight="bold"
                >
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </Text>
              </Box>

              {/* 고객사명 */}
              <Box w="25%">
                <Flex align="center" gap={2}>
                  <Text 
                    color="white" 
                    fontSize="md" 
                    fontWeight="bold"
                    isTruncated
                  >
                    {customer}
                  </Text>
                  {completionRate >= 80 && (
                    <Badge colorScheme="green" fontSize="xs">우수</Badge>
                  )}
                  {delayed > 0 && (
                    <Badge colorScheme="red" fontSize="xs">지연</Badge>
                  )}
                </Flex>
              </Box>

              {/* ⭐ 총 건수 (클릭 가능) */}
              <Box w="10%" textAlign="center">
                <Text 
                  color="cyan.300" 
                  fontSize="2xl" 
                  fontWeight="bold"
                  cursor="pointer"
                  _hover={{ 
                    color: 'cyan.200',
                    textDecoration: 'underline',
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleOpenModal(customer, 'total')}
                >
                  {total}
                </Text>
              </Box>

              {/* ⭐ 진행 (클릭 가능) */}
              <Box w="15%" textAlign="center">
                <Text 
                  color="yellow.300" 
                  fontSize="2xl" 
                  fontWeight="bold"
                  cursor="pointer"
                  _hover={{ 
                    color: 'yellow.200',
                    textDecoration: 'underline',
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleOpenModal(customer, 'inProgress')}
                >
                  {inProgress}
                </Text>
              </Box>

              {/* ⭐ 완료 (클릭 가능) */}
              <Box w="15%" textAlign="center">
                <Text 
                  color="green.300" 
                  fontSize="2xl" 
                  fontWeight="bold"
                  cursor="pointer"
                  _hover={{ 
                    color: 'green.200',
                    textDecoration: 'underline',
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleOpenModal(customer, 'completed')}
                >
                  {completed}
                </Text>
              </Box>

              {/* ⭐ 지연 (클릭 가능) */}
              <Box w="15%" textAlign="center">
                <Text 
                  color={delayed > 0 ? 'red.300' : 'gray.600'} 
                  fontSize="2xl" 
                  fontWeight="bold"
                  cursor={delayed > 0 ? 'pointer' : 'default'}
                  _hover={delayed > 0 ? { 
                    color: 'red.200',
                    textDecoration: 'underline',
                    transform: 'scale(1.1)',
                    transition: 'all 0.2s'
                  } : {}}
                  onClick={() => delayed > 0 && handleOpenModal(customer, 'delayed')}
                >
                  {delayed}
                </Text>
              </Box>

              {/* 평균 경과일 */}
              <Box w="12%" textAlign="center">
                <Text color="cyan.300" fontSize="xl" fontWeight="bold">
                  {avgDays}
                </Text>
              </Box>

              {/* 완료율 */}
              <Box w="10%" textAlign="center">
                <Flex 
                  align="center" 
                  justify="center" 
                  w="52px" 
                  h="52px" 
                  borderRadius="full"
                  bg={
                    completionRate >= 80 ? 'green.900' :
                    completionRate >= 50 ? 'blue.900' :
                    completionRate >= 30 ? 'yellow.900' :
                    'red.900'
                  }
                  border="3px solid"
                  borderColor={
                    completionRate >= 80 ? 'green.500' :
                    completionRate >= 50 ? 'blue.500' :
                    completionRate >= 30 ? 'yellow.500' :
                    'red.500'
                  }
                  mx="auto"
                >
                  <Text 
                    color={
                      completionRate >= 80 ? 'green.300' :
                      completionRate >= 50 ? 'blue.300' :
                      completionRate >= 30 ? 'yellow.300' :
                      'red.300'
                    }
                    fontSize="md" 
                    fontWeight="bold"
                  >
                    {completionRate}%
                  </Text>
                </Flex>
              </Box>
            </Flex>
          );
        })}

        {/* 합계 행 */}
        <Flex
          px={4}
          py={4}
          bg="gray.700"
          borderTop="3px solid"
          borderColor="cyan.500"
          alignItems="center"
          fontSize="md"
          fontWeight="bold"
          position="sticky"
          bottom={0}
        >
          <Box w="6%" textAlign="center">
            <Text color="cyan.300" fontSize="xl">📊</Text>
          </Box>

          <Box w="25%">
            <Text color="cyan.300" fontSize="xl">합계</Text>
          </Box>

          <Box w="10%" textAlign="center">
            <Text color="cyan.300" fontSize="3xl" fontWeight="bold">
              {totalStats.total}
            </Text>
          </Box>

          <Box w="15%" textAlign="center">
            <Text color="yellow.300" fontSize="3xl" fontWeight="bold">
              {totalStats.inProgress}
            </Text>
          </Box>

          <Box w="15%" textAlign="center">
            <Text color="green.300" fontSize="3xl" fontWeight="bold">
              {totalStats.completed}
            </Text>
          </Box>

          <Box w="15%" textAlign="center">
            <Text color="red.300" fontSize="3xl" fontWeight="bold">
              {totalStats.delayed}
            </Text>
          </Box>

          <Box w="12%" textAlign="center">
            <Text color="cyan.300" fontSize="2xl" fontWeight="bold">
              {avgDaysTotal}
            </Text>
          </Box>

          <Box w="10%" textAlign="center">
            <Flex 
              align="center" 
              justify="center" 
              w="56px" 
              h="56px" 
              borderRadius="full"
              bg={
                completionRateTotal >= 80 ? 'green.900' :
                completionRateTotal >= 50 ? 'blue.900' :
                completionRateTotal >= 30 ? 'yellow.900' :
                'red.900'
              }
              border="3px solid"
              borderColor={
                completionRateTotal >= 80 ? 'green.500' :
                completionRateTotal >= 50 ? 'blue.500' :
                completionRateTotal >= 30 ? 'yellow.500' :
                'red.500'
              }
              mx="auto"
            >
              <Text 
                color={
                  completionRateTotal >= 80 ? 'green.300' :
                  completionRateTotal >= 50 ? 'blue.300' :
                  completionRateTotal >= 30 ? 'yellow.300' :
                  'red.300'
                }
                fontSize="lg" 
                fontWeight="bold"
              >
                {completionRateTotal}%
              </Text>
            </Flex>
          </Box>
        </Flex>
      </Box>

      {/* ⭐ 모달 */}
      <CustomerIssuesModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        customerName={modalState.customerName}
        allIssues={issues}
        initialFilter={modalState.filter}
      />
    </Box>
  );
};

export default CustomerStats;
