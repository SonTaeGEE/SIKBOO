package com.stg.sikboo.groupbuying.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.stg.sikboo.groupbuying.service.GroupBuyingSchedulerService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공동구매 자동 마감 스케줄러
 * 1분마다 실행되어 마감 시간이 지난 공동구매를 자동으로 마감 처리합니다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GroupBuyingScheduler {
    
    private final GroupBuyingSchedulerService schedulerService;
    
    /**
     * 마감 시간이 지난 공동구매 자동 마감
     * 매 분마다 실행 (cron: 초 분 시 일 월 요일)
     */
    @Scheduled(cron = "0 * * * * *")
    public void closeExpiredGroupBuyings() {
        log.debug("[마감 시간이 지난 공동구매 자동 마감 스케줄러] 실행 - 서비스 호출");
        schedulerService.closeExpiredGroupBuyings();
        log.debug("[마감 시간이 지난 공동구매 자동 마감 스케줄러] 완료");
    }
}
