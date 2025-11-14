package com.stg.sikboo.groupbuying.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Status;
import com.stg.sikboo.groupbuying.domain.repository.GroupBuyingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupBuyingSchedulerService {
    
    private final GroupBuyingRepository groupBuyingRepository;
    
    /**
     * 마감 시간이 지난 공동구매를 자동으로 마감 처리
     * 트랜잭션 내에서 실행됨
     */
    @Transactional
    public void closeExpiredGroupBuyings() {
        LocalDateTime now = LocalDateTime.now();
        
        // 모집중 상태이면서 마감 시간이 지난 공동구매 조회
        List<GroupBuying> expiredGroupBuyings = groupBuyingRepository
            .findByStatusAndDeadlineBefore(Status.RECRUITING, now);
        
        if (expiredGroupBuyings.isEmpty()) {
            return;
        }
        
        // 마감 처리
        for (GroupBuying groupBuying : expiredGroupBuyings) {
            groupBuying.closeByDeadline();
        }

        groupBuyingRepository.saveAll(expiredGroupBuyings);

        log.debug("=== [서비스] 공동구매 자동 마감 완료: {}건 처리 ===", expiredGroupBuyings.size());
    }
}
