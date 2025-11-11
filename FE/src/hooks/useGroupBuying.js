import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
