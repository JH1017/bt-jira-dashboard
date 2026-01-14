import { useState, useEffect } from 'react';
import { Box, Text, Badge, Flex, Button } from '@chakra-ui/react';

const IssueTable = ({ issues, title, pageInterval = 60000 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const itemsPerPage = 14;

  const totalPages = Math.ceil((issues?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIssues = issues?.slice(startIndex, endIndex) || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [issues]);

  // 페이지 자동 전환 - pageInterval 사용
  useEffect(() => {
    if (totalPages <= 1) return;
    
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentPage(prev => prev >= totalPages ? 1 : prev + 1);
        setIsVisible(true);
      }, 500);
    }, pageInterval);

    return () => clearInterval(interval);
  }, [totalPages, pageInterval]);

  const goToPage = (page) => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentPage(page);
      setIsVisible(true);
    }, 300);
  };

  // SRM 진행단계 색상
  const getSrmColor = (srmStatus) => {
    const colors = {
      '0.선조치': 'blue',
      '1.접수': 'cyan',
      '2.분석/검토': 'yellow',
      '3.사업부서검토': 'orange',
      '4.조치/적용': 'purple',
      '5.모니터링': 'green',
      '9.보류중(사유-댓글)': 'gray',      
    };
    return colors[srmStatus] || 'gray';
  };

  const getStatusColor = (status) => {
    const colors = { 'Open': 'blue', 'In Progress': 'yellow', '작업중': 'yellow', 'Resolved': 'green', 'Closed': 'gray', '완료': 'green' };
    return colors[status] || 'purple';
  };

  const getDaysColor = (days) => {
    if (days >= 30) return 'red.300';
    if (days >= 14) return 'orange.300';
    if (days >= 7) return 'yellow.300';
    return 'green.300';
  };

  // 초/분 변환 함수
  const formatInterval = (ms) => {
    const seconds = ms / 1000;
    if (seconds >= 60) {
      return `${seconds / 60}분`;
    }
    return `${seconds}초`;
  };

  if (!issues || issues.length === 0) {
    return (
      <Box bg="gray.800" p={3} borderRadius="md" textAlign="center">
        <Text color="gray.400" fontSize="lg">📭 표시할 이슈가 없습니다</Text>
      </Box>
    );
  }

  return (
    <Box
      opacity={isVisible ? 1 : 0}
      transition="opacity 0.5s ease-in-out"
      h="100%"
      display="flex"
      flexDirection="column"
    >
      {/* 테이블 */}
      <Box bg="gray.800" borderRadius="lg" overflow="hidden" flex="1">
        {/* 헤더 */}
        <Flex bg="gray.700" p={2} fontWeight="bold" color="gray.300" fontSize="md">
          <Box w="4%">No</Box>
          <Box w="9%">접수일</Box>
          <Box w="5%">경과</Box>
          <Box w="9%">완료예정</Box>
          <Box w="5%">지연</Box>
          <Box w="8%">이슈 키</Box>
          <Box w="35%">제목</Box>
          <Box w="7%">진행단계</Box>
          <Box w="8%">상태</Box>
          <Box w="10%">담당자</Box>
        </Flex>

        {/* 바디 */}
        {paginatedIssues.map((issue, index) => (
          <Flex
            key={issue.key}
            p={2}
            bg={issue.isDelayed ? 'red.900' : index % 2 === 0 ? 'gray.800' : 'gray.750'}
            borderBottom="1px solid"
            borderColor="gray.700"
            _hover={{ bg: issue.isDelayed ? 'red.800' : 'gray.700' }}
            alignItems="center"
            fontSize="xl"
            animation={issue.isDelayed ? 'pulse 2s infinite' : 'none'}
          >
            <Box w="4%" color="gray.400">{startIndex + index + 1}</Box>
            <Box w="9%" color="gray.300">{issue.createdDate || '-'}</Box>
            <Box w="5%" color={getDaysColor(issue.daysFromCreated)} fontWeight="bold">
              {issue.daysFromCreated || 0}일
            </Box>
            <Box w="9%" color={issue.isDelayed ? 'red.300' : 'gray.300'}>
              {issue.dueDate || '-'}
            </Box>
            <Box w="5%">
              {issue.isDelayed ? (
                <Badge colorPalette="red" fontSize="xs">
                  🚨{issue.delayDays}일
                </Badge>
              ) : (
                <Text as="span" color="green.300">-</Text>
              )}
            </Box>
            <Box
              w="8%"
              color="cyan.300"
              fontWeight="bold"
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
              onClick={() => window.open(`http://qa.bridgetec.co.kr/jira/browse/${issue.key}`, '_blank')}
            >
              {issue.key}
            </Box>
            <Box w="35%" color={issue.isDelayed ? 'red.200' : 'gray.100'} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              {issue.summary}
            </Box>
            <Box w="7%">
              <Badge colorPalette={getSrmColor(issue.srmStatus)} fontSize="xs">{issue.srmStatus || '-'}</Badge>
            </Box>
            <Box w="8%">
              <Badge colorPalette={getStatusColor(issue.status)} fontSize="xs">{issue.status}</Badge>
            </Box>
            <Box w="10%" color="gray.300">{issue.assignee}</Box>
          </Flex>
        ))}
      </Box>

      {/* 푸터 */}
      <Flex justify="space-between" align="center" py={1} px={1} flexShrink={0}>
        <Text color="gray.400" fontSize="sm">
          {title} - 총 {issues?.length || 0}개
        </Text>
        
        {totalPages > 1 && (
          <Flex align="center" gap={2}>
            <Button
              size="xs"
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              color="white"
              borderColor="gray.500"
              _hover={{ bg: 'gray.600' }}
              variant="outline"
            >
              ◀ 이전
            </Button>
            <Text color="gray.300" fontSize="sm">{currentPage} / {totalPages}</Text>
            <Button
              size="xs"
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              color="white"
              borderColor="gray.500"
              _hover={{ bg: 'gray.600' }}
              variant="outline"
            >
              다음 ▶
            </Button>
          </Flex>
        )}

        <Text color="gray.500" fontSize="xs">
          🔄 {formatInterval(pageInterval)}마다 자동 넘김 | 5분마다 데이터 갱신
        </Text>
      </Flex>
    </Box>
  );
};

export default IssueTable;
