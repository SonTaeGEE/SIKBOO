import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGroupBuying,
  getGroupBuying,
  getAllGroupBuyings,
  getActiveGroupBuyings,
  getGroupBuyingsByCategory,
  getMyGroupBuyings,
  updateGroupBuying,
  deleteGroupBuying,
  joinGroupBuying,
  leaveGroupBuying,
  getMyParticipatingGroupBuyings,
  checkParticipation,
  getParticipantsByGroupBuying,
  searchGroupBuyings,
  searchMyParticipatingGroupBuyings,
} from '@/api/groupBuyingApi';

// Query Keys
export const groupBuyingKeys = {
  all: ['groupBuyings'],
  lists: () => [...groupBuyingKeys.all, 'list'],
  list: (filters) => [...groupBuyingKeys.lists(), filters],
  details: () => [...groupBuyingKeys.all, 'detail'],
  detail: (id) => [...groupBuyingKeys.details(), id],
  active: () => [...groupBuyingKeys.all, 'active'],
  category: (category) => [...groupBuyingKeys.all, 'category', category],
  my: (memberId) => [...groupBuyingKeys.all, 'my', memberId],
  participating: (memberId) => [...groupBuyingKeys.all, 'participating', memberId],
  participation: (groupBuyingId, memberId) => [
    ...groupBuyingKeys.all,
    'participation',
    groupBuyingId,
    memberId,
  ],
  participants: (groupBuyingId) => [...groupBuyingKeys.all, 'participants', groupBuyingId],
};

/**
 * 공동구매 생성 Mutation
 */
export const useCreateGroupBuying = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroupBuying,
    onSuccess: () => {
      // 목록 쿼리 무효화 (새로고침)
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.active() });
    },
  });
};

/**
 * 공동구매 단건 조회 Query
 */
export const useGroupBuying = (id) => {
  return useQuery({
    queryKey: groupBuyingKeys.detail(id),
    queryFn: () => getGroupBuying(id),
    enabled: !!id,
  });
};

/**
 * 전체 공동구매 목록 조회 Query
 */
export const useAllGroupBuyings = () => {
  return useQuery({
    queryKey: groupBuyingKeys.lists(),
    queryFn: getAllGroupBuyings,
  });
};

/**
 * 모집중인 공동구매 목록 조회 Query
 */
export const useActiveGroupBuyings = (options = {}) => {
  return useQuery({
    queryKey: groupBuyingKeys.active(),
    queryFn: getActiveGroupBuyings,
    ...options,
  });
};

/**
 * 카테고리별 공동구매 목록 조회 Query
 */
export const useGroupBuyingsByCategory = (category) => {
  return useQuery({
    queryKey: groupBuyingKeys.category(category),
    queryFn: () => getGroupBuyingsByCategory(category),
    enabled: !!category,
  });
};

/**
 * 내가 만든 공동구매 목록 조회 Query
 */
export const useMyGroupBuyings = (memberId) => {
  return useQuery({
    queryKey: groupBuyingKeys.my(memberId),
    queryFn: () => getMyGroupBuyings(memberId),
    enabled: !!memberId,
  });
};

/**
 * 공동구매 수정 Mutation
 */
export const useUpdateGroupBuying = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroupBuying,
    onSuccess: (data, variables) => {
      // 해당 공동구매 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.detail(variables.id) });
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.lists() });
    },
  });
};

/**
 * 공동구매 삭제 Mutation
 */
export const useDeleteGroupBuying = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroupBuying,
    onSuccess: () => {
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.active() });
    },
  });
};

/**
 * 공동구매 참여 Mutation
 */
export const useJoinGroupBuying = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroupBuying,
    onSuccess: (data, variables) => {
      // 해당 공동구매 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.detail(variables.id) });
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.active() });
      // 참여자 목록 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.participants(variables.id) });
      // 참여 여부 무효화
      queryClient.invalidateQueries({
        queryKey: groupBuyingKeys.participation(variables.id, variables.memberId),
      });
    },
  });
};

/**
 * 공동구매 나가기 Mutation
 */
export const useLeaveGroupBuying = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroupBuying,
    onSuccess: (data, variables) => {
      // 해당 공동구매 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.detail(variables.id) });
      // 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.active() });
      // 참여자 목록 무효화
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.participants(variables.id) });
      // 참여 여부 무효화
      queryClient.invalidateQueries({
        queryKey: groupBuyingKeys.participation(variables.id, variables.memberId),
      });
    },
  });
};

/**
 * 내가 참여한 공동구매 목록 조회 Query
 */
export const useMyParticipatingGroupBuyings = (memberId, options = {}) => {
  return useQuery({
    queryKey: groupBuyingKeys.participating(memberId),
    queryFn: () => getMyParticipatingGroupBuyings(memberId),
    enabled: !!memberId,
    ...options,
  });
};

/**
 * 참여 여부 확인 Query
 */
export const useCheckParticipation = (groupBuyingId, memberId) => {
  return useQuery({
    queryKey: groupBuyingKeys.participation(groupBuyingId, memberId),
    queryFn: () => checkParticipation(groupBuyingId, memberId),
    enabled: !!groupBuyingId && !!memberId,
  });
};

/**
 * 특정 공동구매의 참여자 목록 조회 Query
 */
export const useParticipantsByGroupBuying = (groupBuyingId) => {
  return useQuery({
    queryKey: groupBuyingKeys.participants(groupBuyingId),
    queryFn: () => getParticipantsByGroupBuying(groupBuyingId),
    enabled: !!groupBuyingId,
  });
};

/**
 * 통합 필터링 무한 스크롤 Query (모집중인 공동구매)
 * @param {Object} filters - 필터 옵션
 * @param {string} filters.search - 검색어
 * @param {string} filters.category - 카테고리
 * @param {string} filters.status - 상태 (기본값: RECRUITING)
 * @param {number} filters.lat - 사용자 위도
 * @param {number} filters.lng - 사용자 경도
 * @param {number} filters.distance - 최대 거리 (km)
 * @param {number} filters.pageSize - 페이지 크기 (기본값: 20)
 */
export const useInfiniteGroupBuyings = (filters = {}) => {
  const { search, category, status = 'RECRUITING', lat, lng, distance, pageSize = 20 } = filters;

  return useInfiniteQuery({
    queryKey: ['groupBuyings', 'infinite', { search, category, status, lat, lng, distance }],
    queryFn: ({ pageParam = 0 }) =>
      searchGroupBuyings({
        search,
        category,
        status,
        lat,
        lng,
        distance,
        page: pageParam,
        size: pageSize,
      }),
    getNextPageParam: (lastPage) => {
      // hasNext가 true면 다음 페이지 번호 반환, 아니면 undefined
      return lastPage.hasNext ? lastPage.number + 1 : undefined;
    },
    initialPageParam: 0,
    // 페이지 데이터 병합
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // 모든 페이지의 content를 하나의 배열로 병합
      items: data.pages.flatMap((page) => page.content),
    }),
    enabled: !!lat && !!lng, // lat, lng가 있을 때만 쿼리 실행
  });
};

/**
 * 내가 참여한 공동구매 무한 스크롤 Query
 * @param {Object} filters - 필터 옵션
 * @param {number} filters.memberId - 회원 ID
 * @param {string} filters.search - 검색어
 * @param {string} filters.category - 카테고리
 * @param {number} filters.pageSize - 페이지 크기 (기본값: 20)
 */
export const useInfiniteMyParticipatingGroupBuyings = (filters = {}) => {
  const { memberId, search, category, pageSize = 20 } = filters;

  return useInfiniteQuery({
    queryKey: ['myParticipating', 'infinite', { memberId, search, category }],
    queryFn: ({ pageParam = 0 }) =>
      searchMyParticipatingGroupBuyings({
        memberId,
        search,
        category,
        page: pageParam,
        size: pageSize,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.number + 1 : undefined;
    },
    initialPageParam: 0,
    enabled: !!memberId, // memberId가 있을 때만 쿼리 실행
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((page) => page.content),
    }),
  });
};
