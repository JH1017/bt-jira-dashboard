import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Flex,
  CloseButton,
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContentGroup,
} from '@chakra-ui/react';
import IssueTable from '../IssueTable/IssueTable';

const CustomerIssuesModal = ({ isOpen, onClose, customerName, allIssues, initialFilter = 'total' }) => {
  const [activeTab, setActiveTab] = useState(0);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 초기 필터에 따라 탭 설정
  useEffect(() => {
    if (isOpen) {
      const filterMap = { total: 0, inProgress: 1, completed: 2, delayed: 3 };
      setActiveTab(filterMap[initialFilter] || 0);
    }
  }, [isOpen, initialFilter]);

  // 고객사별 이슈 필터링
  const customerIssues = (allIssues || []).filter(
    issue => issue.customer === customerName
  );

  // 필터별 이슈 분류
  const allIssuesList = customerIssues;
  
  const inProgressIssues = customerIssues.filter(issue => {
    const status = (issue.status || '').toLowerCase().trim();
    return !(status === 'resolved' || status === 'closed' || status === '완료' || status === 'done');
  });
  
  const completedIssues = customerIssues.filter(issue => {
    const status = (issue.status || '').toLowerCase().trim();
    return status === 'resolved' || status === 'closed' || status === '완료' || status === 'done';
  });
  
  const delayedIssues = customerIssues.filter(issue => {
    const status = (issue.status || '').toLowerCase().trim();
    const isCompleted = status === 'resolved' || status === 'closed' || status === '완료' || status === 'done';
    return issue.isDelayed && !isCompleted;
  });

  // 통계
  const stats = {
    total: allIssuesList.length,
    inProgress: inProgressIssues.length,
    completed: completedIssues.length,
    delayed: delayedIssues.length,
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl" placement="center">
      <DialogBackdrop bg="blackAlpha.800" onClick={onClose} />
      <DialogPositioner>
        <DialogContent 
          bg="gray.900" 
          maxW="92vw" 
          maxH="88vh" 
          w="1400px"
          m={0}
          display="flex"
          flexDirection="column"
        >
          <DialogHeader bg="gray.800" borderBottom="1px solid" borderColor="gray.700" p={3} position="relative">
            <Flex alignItems="center" justifyContent="space-between">
              <Box>
                <DialogTitle color="white" fontSize="xl" fontWeight="bold">
                  🏢 {customerName} 이슈
                </DialogTitle>
                <Flex gap={4} mt={2}>
                  <Text color="gray.400" fontSize="sm">
                    총 <Text as="span" color="cyan.300" fontWeight="bold">{stats.total}</Text>건
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    진행 <Text as="span" color="yellow.300" fontWeight="bold">{stats.inProgress}</Text>건
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    완료 <Text as="span" color="green.300" fontWeight="bold">{stats.completed}</Text>건
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    지연 <Text as="span" color="red.300" fontWeight="bold">{stats.delayed}</Text>건
                  </Text>
                </Flex>
              </Box>
              <Box position="absolute" top={3} right={3}>
                <CloseButton
                  onClick={onClose}
                  size="md"
                  color="gray.400"
                  _hover={{ 
                    color: 'white', 
                    bg: 'gray.700',
                    transform: 'scale(1.1)'
                  }}
                />
              </Box>
            </Flex>
          </DialogHeader>

          <DialogBody p={0} overflow="hidden" display="flex" flexDirection="column" flex="1">
            <TabsRoot value={activeTab.toString()} onValueChange={(e) => setActiveTab(parseInt(e.value))}>
              <TabsList borderBottom="1px solid" borderColor="gray.700" bg="gray.800" px={3} pt={2}>
                <TabsTrigger 
                  value="0"
                  color="gray.300"
                  _selected={{ color: 'cyan.300', borderColor: 'cyan.300' }}
                  fontSize="sm"
                >
                  전체 ({stats.total})
                </TabsTrigger>
                <TabsTrigger 
                  value="1"
                  color="gray.300"
                  _selected={{ color: 'yellow.300', borderColor: 'yellow.300' }}
                  fontSize="sm"
                >
                  진행 ({stats.inProgress})
                </TabsTrigger>
                <TabsTrigger 
                  value="2"
                  color="gray.300"
                  _selected={{ color: 'green.300', borderColor: 'green.300' }}
                  fontSize="sm"
                >
                  완료 ({stats.completed})
                </TabsTrigger>
                <TabsTrigger 
                  value="3"
                  color="gray.300"
                  _selected={{ color: 'red.300', borderColor: 'red.300' }}
                  fontSize="sm"
                >
                  지연 ({stats.delayed})
                </TabsTrigger>
              </TabsList>

              <TabsContentGroup flex="1" overflow="hidden" display="flex" flexDirection="column">
                <TabsContent value="0" p={3} flex="1" overflow="hidden" display="flex" flexDirection="column">
                  <IssueTable
                    issues={allIssuesList}
                    title={`${customerName} - 전체 이슈`}
                    pageInterval={60000}
                  />
                </TabsContent>

                <TabsContent value="1" p={3} flex="1" overflow="hidden" display="flex" flexDirection="column">
                  <IssueTable
                    issues={inProgressIssues}
                    title={`${customerName} - 진행중 이슈`}
                    pageInterval={60000}
                  />
                </TabsContent>

                <TabsContent value="2" p={3} flex="1" overflow="hidden" display="flex" flexDirection="column">
                  <IssueTable
                    issues={completedIssues}
                    title={`${customerName} - 완료 이슈`}
                    pageInterval={60000}
                  />
                </TabsContent>

                <TabsContent value="3" p={3} flex="1" overflow="hidden" display="flex" flexDirection="column">
                  <IssueTable
                    issues={delayedIssues}
                    title={`${customerName} - 지연 이슈`}
                    pageInterval={60000}
                  />
                </TabsContent>
              </TabsContentGroup>
            </TabsRoot>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default CustomerIssuesModal;
