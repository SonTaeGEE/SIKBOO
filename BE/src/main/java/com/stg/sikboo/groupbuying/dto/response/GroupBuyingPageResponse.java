package com.stg.sikboo.groupbuying.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 페이지네이션 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupBuyingPageResponse {
    
    private List<GroupBuyingResponse> content;
    private int totalPages;
    private long totalElements;
    private int number; // 현재 페이지 번호 (0부터 시작)
    private int size;   // 페이지 크기
    private boolean first;
    private boolean last;
    private boolean hasNext;
}
