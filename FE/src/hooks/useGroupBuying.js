import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGroupBuying,
  getGroupBuying,
  getGroupBuyingsByCategory,
  updateGroupBuying,
  deleteGroupBuying,
  joinGroupBuying,
  leaveGroupBuying,
  checkParticipation,
  getParticipantsByGroupBuying,
  searchGroupBuyings,
  searchMyParticipatingGroupBuyings,
} from '@/api/groupBuyingApi';

// Query Keys
export const groupBuyingKeys = {
  all: ['groupBuyings'],
  details: () => [...groupBuyingKeys.all, 'detail'],
  detail: (id) => [...groupBuyingKeys.details(), id],
  category: (category) => [...groupBuyingKeys.all, 'category', category],
  infinite: (filters = {}) => [...groupBuyingKeys.all, 'infinite', filters],
  participating: (memberId) => [...groupBuyingKeys.all, 'participating', memberId],
  participation: (groupBuyingId, memberId) => [
    ...groupBuyingKeys.all,
    'participation',
    groupBuyingId,
    memberId,
  ],
  participants: (groupBuyingId) => [...groupBuyingKeys.all, 'participants', groupBuyingId],
  myParticipating: (filters = {}) => [
    ...groupBuyingKeys.all,
    'myParticipating',
    'infinite',
    filters,
  ],
};

/**
 * 공동구매 생성 Mutation
 */
export const useCreateGroupBuying = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroupBuying,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.all });
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
 * 공동구매 수정 Mutation
 */
export const useUpdateGroupBuying = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroupBuying,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.all });
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.all });
      // 삭제된 상세 쿼리 제거
      queryClient.removeQueries({ queryKey: groupBuyingKeys.detail(variables) });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.all });
    },
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
    queryKey: groupBuyingKeys.infinite(filters),
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
    queryKey: groupBuyingKeys.myParticipating(filters),
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
