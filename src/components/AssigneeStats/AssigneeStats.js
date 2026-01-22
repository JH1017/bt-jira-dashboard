import { useState, useEffect } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import { useAllIssues } from '../../hooks/useJiraData';
import AssigneeIssuesModal from './AssigneeIssuesModal';

const AssigneeStats = () => {
  const { data: issues, isLoading } = useAllIssues();
  const [assigneeData, setAssigneeData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('total'); // 'total', 'delayed', 'inProgress'

  // 개발6팀 팀원 목록
  const teamMembers = [
    '이재우', '박시용', '정진우', '김형준', '이환호', '장승국', '박상명', '강대호',
    '윤건용', '박영서', '황희성', '박진미', '박천규', '강준환'
  ];

  // 팀원 여부 확인
  const isTeamMember = (name) => {
    return teamMembers.includes(name);
  };

  useEffect(() => {
    if (issues && issues.length > 0) {
      // 담당자별로 이슈 집계
      const assigneeMap = {};
      
      issues.forEach(issue => {
        const assignee = issue.assignee || '미지정';
        
        if (!assigneeMap[assignee]) {
          assigneeMap[assignee] = {
            name: assignee,
            total: 0,
            delayed: 0,
            inProgress: 0
          };
        }
        
        assigneeMap[assignee].total++;
        
        if (issue.isDelayed) {
          assigneeMap[assignee].delayed++;
        }
        
        if (issue.status === 'In Progress' || issue.status === '작업중') {
          assigneeMap[assignee].inProgress++;
        }
      });

      // 배열로 변환 후 총 건수 기준 정렬
      const sortedData = Object.values(assigneeMap).sort((a, b) => b.total - a.total);
      setAssigneeData(sortedData);
    }
  }, [issues]);

  // 모달 열기
  const handleOpenModal = (assigneeName, filterType) => {
    setSelectedAssignee(assigneeName);
    setSelectedFilter(filterType);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignee(null);
    setSelectedFilter('total');
  };

  if (isLoading) {
    return (
      <Box h="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="xl">👤 담당자별 현황 로딩중...</Text>
      </Box>
    );
  }

  // 총 통계
  const totalStats = assigneeData.reduce((acc, item) => ({
    total: acc.total + item.total,
    delayed: acc.delayed + item.delayed,
    inProgress: acc.inProgress + item.inProgress
  }), { total: 0, delayed: 0, inProgress: 0 });

  return (
    <Box h="100%" display="flex" flexDirection="column" bg="gray.800" p={4}>
      {/* 헤더 */}
      <Box display="flex" justifyContent="center" alignItems="center" mb={4} gap={4}>
        <Text color="white" fontSize="5xl" fontWeight="bold">
          👤 담당자별 이슈 현황
        </Text>
        <Text color="gray.400" fontSize="2xl">
          총 <Text as="span" color="blue.300" fontWeight="bold">{totalStats.total}</Text>건 | 
          지연 <Text as="span" color="red.300" fontWeight="bold">{totalStats.delayed}</Text>건 |
          작업중 <Text as="span" color="yellow.300" fontWeight="bold">{totalStats.inProgress}</Text>건
        </Text>
      </Box>

      {/* 카드 그리드 */}
      <Box flex="1" overflow="auto">
        <Flex flexWrap="wrap" gap={4} justifyContent="center">
          {assigneeData.map((assignee, index) => (
            <Box
                key={assignee.name}
                bg={isTeamMember(assignee.name) ? 'gray.700' : 'gray.800'}
                borderRadius="lg"
                p={6}
                minW="280px"
                maxW="350px"
                flex="1"
                border="2px solid"
                borderColor={
                    assignee.delayed > 0 
                    ? 'red.500' 
                    : isTeamMember(assignee.name) 
                        ? 'gray.600' 
                        : 'gray.700'
                }
                opacity={isTeamMember(assignee.name) ? 1 : 0.7}
              position="relative"
              _hover={{ bg: 'gray.650', transform: 'scale(1.02)' }}
              transition="all 0.2s"
            >
              {/* 순위 표시 */}
              <Box
                position="absolute"
                top="-12px"
                left="-12px"
                bg={
                    !isTeamMember(assignee.name) 
                    ? 'gray.600' 
                    : index < 3 
                        ? 'yellow.500' 
                        : 'gray.500'
                }
                color="white"
                borderRadius="full"
                w="40px"
                h="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xl"
                fontWeight="bold"
              >
                {index + 1}
              </Box>

              {/* 담당자 이름 */}
              <Text 
                color={isTeamMember(assignee.name) ? 'white' : 'gray.400'} 
                fontSize="2xl" 
                fontWeight="bold" 
                mb={4} 
                textAlign="center"
                >
                {assignee.name}
                {!isTeamMember(assignee.name) && (
                    <Text as="span" fontSize="sm" color="gray.500" ml={2}>(유관부서)</Text>
                )}
              </Text> 

              {/* 통계 */}
              <Flex justifyContent="space-around" mb={2}>
                <Box 
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="transform 0.2s"
                  onClick={() => handleOpenModal(assignee.name, 'total')}
                >
                  <Text color="gray.400" fontSize="xl">총</Text>
                  <Text 
                    color="blue.300" 
                    fontSize="7xl" 
                    fontWeight="bold"
                    textDecoration="underline"
                    textDecorationColor="blue.500"
                    textDecorationThickness="2px"
                  >
                    {assignee.total}
                  </Text>
                </Box>
                <Box 
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="transform 0.2s"
                  onClick={() => handleOpenModal(assignee.name, 'delayed')}
                >
                  <Text color="gray.400" fontSize="xl">지연</Text>
                  <Text 
                    color={assignee.delayed > 0 ? 'red.300' : 'gray.500'} 
                    fontSize="7xl" 
                    fontWeight="bold"
                    textDecoration={assignee.delayed > 0 ? "underline" : "none"}
                    textDecorationColor="red.500"
                    textDecorationThickness="2px"
                    cursor={assignee.delayed > 0 ? "pointer" : "default"}
                  >
                    {assignee.delayed}
                  </Text>
                </Box>
                <Box 
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ transform: 'scale(1.1)' }}
                  transition="transform 0.2s"
                  onClick={() => handleOpenModal(assignee.name, 'inProgress')}
                >
                  <Text color="gray.400" fontSize="xl">작업중</Text>
                  <Text 
                    color="yellow.300" 
                    fontSize="7xl" 
                    fontWeight="bold"
                    textDecoration="underline"
                    textDecorationColor="yellow.500"
                    textDecorationThickness="2px"
                  >
                    {assignee.inProgress}
                  </Text>
                </Box>
              </Flex>

              {/* 지연 경고 */}
              {assignee.delayed > 0 && (
                <Box 
                  bg="red.900" 
                  borderRadius="md" 
                  p={2} 
                  mt={3}
                  textAlign="center"
                >
                  <Text color="red.300" fontSize="xs">🚨 지연 이슈 {assignee.delayed}건</Text>
                </Box>
              )}
            </Box>
          ))}
        </Flex>
      </Box>

      {/* 푸터 */}
      <Box mt={2} display="flex" justifyContent="center" gap={4}>
        <Text color="gray.500" fontSize="sm">
          🔄 5분마다 데이터 갱신
        </Text>
        <Text color="gray.500" fontSize="sm">
          💡 숫자를 클릭하면 상세 이슈 목록을 볼 수 있습니다
        </Text>
      </Box>

      {/* 이슈 목록 모달 */}
      <AssigneeIssuesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        assigneeName={selectedAssignee}
        allIssues={issues}
        initialFilter={selectedFilter}
      />
    </Box>
  );
};

export default AssigneeStats;