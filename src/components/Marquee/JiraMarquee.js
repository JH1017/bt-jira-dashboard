import Marquee from 'react-fast-marquee';
import { Box, Flex, Text, Badge } from '@chakra-ui/react';

function JiraMarquee({ issues }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Blocker': return 'red';
      case 'Critical': return 'red';
      case 'Major': return 'orange';
      case 'Minor': return 'yellow';
      case 'Trivial': return 'green';
      case 'Information': return 'blue';
      default: return 'gray';
    }
  };

  if (!issues || issues.length === 0) {
    return (
      <Box bg="gray.800" p={4} borderRadius="md" textAlign="center">
        <Text color="green.300" fontSize="md">✅ 이슈가 없습니다</Text>
      </Box>
    );
  }

  return (
    <Box bg="gray.800" p={4} borderRadius="md">
      <Marquee speed={50} pauseOnHover={true} gradient={false}>
        {issues?.map((issue) => (
          <Flex
            key={issue.key}
            align="center"
            mx={5}
            gap={2}
            bg={issue.isDelayed ? 'red.900' : 'gray.700'}
            px={4}
            py={2}
            borderRadius="md"
            border={issue.isDelayed ? '1px solid' : 'none'}
            borderColor={issue.isDelayed ? 'red.500' : 'transparent'}
            fontSize="md"
          >
            {issue.isDelayed && (
              <Badge colorPalette="red" variant="solid" fontSize="sm">
                🚨 지연
              </Badge>
            )}
            <Badge colorPalette={getPriorityColor(issue.priority)} fontSize="sm">
              {issue.priority}
            </Badge>
            <Text 
              color={issue.isDelayed ? 'red.300' : 'blue.300'} 
              fontWeight="bold"
            >
              {issue.key}
            </Text>
            <Text color={issue.isDelayed ? 'red.100' : 'white'}>
              {issue.summary}
            </Text>
            <Text color="gray.400">
              | {issue.assignee}
            </Text>
            <Badge colorPalette="purple" fontSize="sm">{issue.status}</Badge>
          </Flex>
        ))}
      </Marquee>
    </Box>
  );
}

export default JiraMarquee;
