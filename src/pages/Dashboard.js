import { useState, useEffect } from 'react';
import { Box, Text, Flex, Button } from '@chakra-ui/react';
import JiraMarquee from '../components/Marquee/JiraMarquee';
import IssueTable from '../components/IssueTable/IssueTable';
import SettingsModal from '../components/Settings/SettingsModal';
import ProjectStatus from '../components/ProjectStatus/ProjectStatus';
import AssigneeStats from '../components/AssigneeStats/AssigneeStats';
import ProjectSchedule from '../components/ProjectSchedule/ProjectSchedule';
import MemberSchedule from '../components/MemberSchedule/MemberSchedule';
import BusinessPlan from '../components/BusinessPlan/BusinessPlan';
import GoogleCalendar from '../components/GoogleCalendar/GoogleCalendar';
import CustomerStats from '../components/CustomerStats/CustomerStats';  
import { useJiraStats, useAllIssues, useRefreshStats } from '../hooks/useJiraData';

const Dashboard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [config, setConfig] = useState(null);
  const [queries, setQueries] = useState({
    received: '',
    inProgress: '',
    delayed: '',
    total: ''
  });
  const [visiblePages, setVisiblePages] = useState([0, 1, 2, 3]);
  const [activePage, setActivePage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const { data: stats, isLoading } = useJiraStats(queries);
  const { data: allIssues } = useAllIssues(queries.total);
  const refreshStats = useRefreshStats();

  // 페이지 정보
const allPages = [
  { id: 0, shortTitle: '이슈', color: 'blue.400', title: '📋 개발6팀 이슈 현황' },
  { id: 1, shortTitle: '고객사', color: 'red.400', title: '🏢 고객사별 이슈 집계' }, 
  { id: 2, shortTitle: '담당자', color: 'cyan.400', title: '👤 담당자별 이슈 현황' },
  { id: 3, shortTitle: '할당', color: 'green.400', title: '👨‍💻 프로젝트 투입인력 할당 현황' },
  { id: 4, shortTitle: '투입', color: 'purple.400', title: '📆 인력별 프로젝트 투입현황' },
  { id: 5, shortTitle: '예정', color: 'orange.400', title: '📅 프로젝트 예정' },
  { id: 6, shortTitle: '사업', color: 'pink.400', title: '📊 사업계획' },
  { id: 7, shortTitle: '캘린더', color: 'teal.400', title: '📅 구글 캘린더' }  
];

  const pages = allPages.filter(p => visiblePages.includes(p.id));
  const currentPage = pages.find(p => p.id === activePage) || pages[0] || allPages[0];

  // JSON 설정 파일 로드
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/data/dashboardConfig.json');
        const data = await response.json();
        setConfig(data);
        setQueries(data.queries);
        if (data.visiblePages) {
          setVisiblePages(data.visiblePages);
        }
      } catch (error) {
        console.error('설정 파일 로드 실패:', error);
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 300000);
    return () => clearInterval(interval);
  }, []);

  // visiblePages 변경 시 activePage 조정
  useEffect(() => {
    if (visiblePages.length > 0 && !visiblePages.includes(activePage)) {
      setActivePage(visiblePages[0]);
    }
  }, [visiblePages, activePage]);

  // 전체 화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // F11 키 감지
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 전체 화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('전체 화면 전환 실패:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // 페이지별 자동 슬라이드 시간 설정
  const getInterval = () => {
    if (!config) return 60000;
    switch (activePage) {
      case 0: return config.intervals?.issueStatus || 60000;
      case 1: return config.intervals?.customerStats || 60000; 
      case 2: return config.intervals?.assigneeStats || 60000;
      case 3: return config.intervals?.projectAllocation || 60000;
      case 4: return config.intervals?.memberSchedule || 60000;
      case 5: return config.intervals?.projectSchedule || 60000;
      case 6: return config.intervals?.businessPlan || 60000;
      default: return 60000;
    }
  };


  // 자동 슬라이드
  useEffect(() => {
    if (pages.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setActivePage(prev => {
          const currentIndex = pages.findIndex(p => p.id === prev);
          const nextIndex = (currentIndex + 1) % pages.length;
          return pages[nextIndex].id;
        });
        setIsVisible(true);
      }, 500);
    }, getInterval());

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, config, pages.length, visiblePages]);

  const handleSaveQueries = (newQueries, newVisiblePages) => {
    setQueries(newQueries);
    if (newVisiblePages) {
      setVisiblePages(newVisiblePages);
      if (!newVisiblePages.includes(activePage)) {
        setActivePage(newVisiblePages[0]);
      }
    }
    if (typeof refreshStats === 'function') {
      refreshStats();
    }
    setIsSettingsOpen(false);
  };

  const changePage = (pageId) => {
    setIsVisible(false);
    setTimeout(() => {
      setActivePage(pageId);
      setIsVisible(true);
    }, 300);
  };

  if (isLoading || !config) {
    return (
      <Box h="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.900">
        <Text color="white" fontSize="2xl">데이터 로딩중...</Text>
      </Box>
    );
  }

  return (
    <Box h="100vh" bg="gray.900" display="flex" flexDirection="column" overflow="hidden">
      {/* 헤더 */}
      <Flex
        bg="gray.800"
        p={2}
        px={4}
        alignItems="center"
        justifyContent="space-between"
        borderBottom="1px solid"
        borderColor="gray.700"
        flexShrink={0}
      >
        {/* 왼쪽: 페이지 탭 네비게이션 */}
        <Flex alignItems="center" gap={1}>
          {pages.map((page) => (
            <Box
              key={page.id}
              px={4}
              py={2}
              bg={activePage === page.id ? page.color : 'transparent'}
              color={activePage === page.id ? 'white' : 'gray.200'}
              borderRadius="md"
              cursor="pointer"
              onClick={() => changePage(page.id)}
              transition="all 0.3s"
              _hover={{
                bg: activePage === page.id ? page.color : 'gray.600',
                color: 'white'
              }}
              position="relative"
            >
              <Text fontSize="sm" fontWeight={activePage === page.id ? 'bold' : 'normal'}>
                {page.shortTitle}
              </Text>
              {/* 활성 페이지 하단 표시 */}
              {activePage === page.id && (
                <Box
                  position="absolute"
                  bottom="-2px"
                  left="50%"
                  transform="translateX(-50%)"
                  w="0"
                  h="0"
                  borderLeft="6px solid transparent"
                  borderRight="6px solid transparent"
                  borderTop="6px solid"
                  borderTopColor={page.color}
                />
              )}
            </Box>
          ))}

          {/* 현재 페이지 전체 제목 */}
          <Text color="gray.100" fontSize="sm" ml={4}>
            | {currentPage.title}
          </Text>
        </Flex>

        {/* 오른쪽: 버튼들 */}
        <Flex gap={2}>
          <Button
            size="sm"
            onClick={toggleFullscreen}
            bg="purple.600"
            color="white"
            _hover={{ bg: 'purple.500' }}
          >
            {isFullscreen ? '⛶ 창모드' : '⛶ 전체화면'}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            bg="gray.600"
            color="white"
            _hover={{ bg: 'gray.500' }}
          >
            ⚙️ 설정
          </Button>
        </Flex>
      </Flex>

      {/* 메인 콘텐츠 */}
      <Box
        flex="1"
        overflow="hidden"
        opacity={isVisible ? 1 : 0}
        transition="opacity 0.5s ease-in-out"
      >
        {activePage === 0 && (
          <Box h="100%" display="flex" flexDirection="column" p={4}>
            {/* 전광판 */}
            <Box flexShrink={0} mb={4}>
              <JiraMarquee issues={allIssues || []} />
            </Box>

            {/* 통계 카드 */}
            <Flex gap={4} mb={4} flexShrink={0}>
              {config.cards.map((card) => (
                <Box
                  key={card.key}
                  flex="1"
                  bg="gray.700"
                  p={4}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.600"
                  textAlign="center"
                >
                  <Text color={card.labelColor} fontSize="xl">{card.label}</Text>
                  <Text fontSize="7xl" fontWeight="bold" color={card.color} lineHeight="1">
                    {stats?.[card.key] || 0}
                  </Text>
                </Box>
              ))}
            </Flex>

            {/* 이슈 목록 */}
            <Box flex="1" overflow="hidden" mt={1} borderTop="2px solid" borderColor="gray.600" pt={1}>
              <IssueTable
                issues={allIssues || []}
                title="전체 이슈"
                pageInterval={config.intervals?.issueTablePage || 60000}
              />
            </Box>
          </Box>
        )}

        {activePage === 1 && <CustomerStats issues={allIssues || []} />}
        {activePage === 2 && <AssigneeStats />}
        {activePage === 3 && <ProjectStatus />}
        {activePage === 4 && <MemberSchedule />}
        {activePage === 5 && <ProjectSchedule />}
        {activePage === 6 && <BusinessPlan />}
        {activePage === 7 && <GoogleCalendar />}
      </Box>

      {/* 설정 모달 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        queries={queries}
        visiblePages={visiblePages}
        onSave={handleSaveQueries}
      />
    </Box>
  );
};

export default Dashboard;
