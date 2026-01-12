import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Textarea
} from '@chakra-ui/react';

const SettingsModal = ({ isOpen, onClose, queries, visiblePages = [0, 1, 2, 3], onSave }) => {
  const [localQueries, setLocalQueries] = useState(queries);
  const [localVisiblePages, setLocalVisiblePages] = useState(visiblePages);
  const [activeTab, setActiveTab] = useState('queries'); // 'queries' | 'pages'

  useEffect(() => {
    setLocalQueries(queries);
    setLocalVisiblePages(visiblePages);
  }, [queries, visiblePages, isOpen]);

  const pageList = [
    { id: 0, name: '📋 이슈 현황', color: 'blue.400' },
    { id: 1, name: '👨‍💻 프로젝트 할당', color: 'green.400' },
    { id: 2, name: '📆 투입 현황', color: 'purple.400' },
    { id: 3, name: '📅 프로젝트 예정', color: 'orange.400' }
  ];

  const togglePage = (pageId) => {
    if (localVisiblePages.includes(pageId)) {
      if (localVisiblePages.length > 1) {
        setLocalVisiblePages(localVisiblePages.filter(id => id !== pageId));
      }
    } else {
      setLocalVisiblePages([...localVisiblePages, pageId].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    onSave(localQueries, localVisiblePages);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.700"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="1000"
      onClick={onClose}
    >
      <Box
        bg="gray.800"
        borderRadius="lg"
        p={6}
        w="600px"
        maxH="80vh"
        overflow="auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Text fontSize="xl" fontWeight="bold" color="white" mb={4}>
          ⚙️ 대시보드 설정
        </Text>

        {/* 탭 선택 */}
        <Flex mb={4} gap={2}>
          <Button
            size="sm"
            bg={activeTab === 'queries' ? 'blue.500' : 'gray.600'}
            color="white"
            onClick={() => setActiveTab('queries')}
            _hover={{ bg: activeTab === 'queries' ? 'blue.600' : 'gray.500' }}
          >
            📝 쿼리 설정
          </Button>
          <Button
            size="sm"
            bg={activeTab === 'pages' ? 'blue.500' : 'gray.600'}
            color="white"
            onClick={() => setActiveTab('pages')}
            _hover={{ bg: activeTab === 'pages' ? 'blue.600' : 'gray.500' }}
          >
            📄 페이지 설정
          </Button>
        </Flex>

        {/* 쿼리 설정 탭 */}
        {activeTab === 'queries' && (
          <Box>
            <Box mb={4}>
              <Text color="gray.300" mb={1} fontSize="sm">접수 이슈 쿼리</Text>
              <Textarea
                value={localQueries.received}
                onChange={(e) => setLocalQueries({...localQueries, received: e.target.value})}
                bg="gray.700"
                color="white"
                border="1px solid"
                borderColor="gray.600"
                rows={2}
              />
            </Box>
            <Box mb={4}>
              <Text color="gray.300" mb={1} fontSize="sm">진행 이슈 쿼리</Text>
              <Textarea
                value={localQueries.inProgress}
                onChange={(e) => setLocalQueries({...localQueries, inProgress: e.target.value})}
                bg="gray.700"
                color="white"
                border="1px solid"
                borderColor="gray.600"
                rows={2}
              />
            </Box>
            <Box mb={4}>
              <Text color="gray.300" mb={1} fontSize="sm">지연 이슈 쿼리</Text>
              <Textarea
                value={localQueries.delayed}
                onChange={(e) => setLocalQueries({...localQueries, delayed: e.target.value})}
                bg="gray.700"
                color="white"
                border="1px solid"
                borderColor="gray.600"
                rows={2}
              />
            </Box>
            <Box mb={4}>
              <Text color="gray.300" mb={1} fontSize="sm">전체 이슈 쿼리</Text>
              <Textarea
                value={localQueries.total}
                onChange={(e) => setLocalQueries({...localQueries, total: e.target.value})}
                bg="gray.700"
                color="white"
                border="1px solid"
                borderColor="gray.600"
                rows={2}
              />
            </Box>
          </Box>
        )}

        {/* 페이지 설정 탭 */}
        {activeTab === 'pages' && (
          <Box>
            <Text color="gray.400" fontSize="sm" mb={3}>
              표시할 페이지를 선택하세요 (최소 1개)
            </Text>
            {pageList.map((page) => (
              <Flex
                key={page.id}
                p={3}
                mb={2}
                bg={localVisiblePages.includes(page.id) ? 'gray.700' : 'gray.750'}
                borderRadius="md"
                alignItems="center"
                cursor="pointer"
                onClick={() => togglePage(page.id)}
                _hover={{ bg: 'gray.600' }}
              >
                <Box
                  w="18px"
                  h="18px"
                  borderRadius="sm"
                  border="2px solid"
                  borderColor={localVisiblePages.includes(page.id) ? 'blue.400' : 'gray.500'}
                  bg={localVisiblePages.includes(page.id) ? 'blue.400' : 'transparent'}
                  mr={3}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {localVisiblePages.includes(page.id) && (
                    <Text color="white" fontSize="xs" fontWeight="bold">✓</Text>
                  )}
              </Box>
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={page.color}
                  mr={2}
                />
                <Text color="white">{page.name}</Text>
              </Flex>
            ))}
            <Text color="gray.500" fontSize="xs" mt={3}>
              선택한 페이지: {localVisiblePages.length}개
            </Text>
          </Box>
        )}

        {/* 버튼 */}
        <Flex justify="flex-end" mt={4} gap={2}>
          <Button
            variant="outline"
            color="gray.300"
            borderColor="gray.500"
            onClick={onClose}
            _hover={{ bg: 'gray.700' }}
          >
            취소
          </Button>
          <Button
            bg="blue.500"
            color="white"
            onClick={handleSave}
            _hover={{ bg: 'blue.600' }}
          >
            저장
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default SettingsModal;
