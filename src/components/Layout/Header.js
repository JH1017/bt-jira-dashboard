import { Box, Flex, Heading, Text } from '@chakra-ui/react';

function Header() {
  return (
    <Box bg="blue.600" px={6} py={4} color="white">
      <Flex justify="space-between" align="center">
        <Heading size="lg">🎯 BT-JIRA Dashboard</Heading>
        <Text fontSize="sm">실시간 이슈 현황판</Text>
      </Flex>
    </Box>
  );
}

export default Header;
