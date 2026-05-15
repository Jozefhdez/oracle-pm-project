package com.springboot.MyTodoList.dto;

import com.springboot.MyTodoList.model.SprintKpiSnapshot;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class SprintKpiResponse {

    private UUID id;
    private BigDecimal avgCycleTimeDays;
    private BigDecimal scopeCreepRatePct;
    private BigDecimal blockerResolutionDays;
    private int tasksReworked;
    private int tasksCompleted;
    private BigDecimal totalHoursWorked;
    private LocalDateTime calculatedAt;
    private BigDecimal cycleTimeChangePct;

    public static SprintKpiResponse from(SprintKpiSnapshot s) {
        SprintKpiResponse r = new SprintKpiResponse();
        r.id = s.getId();
        r.avgCycleTimeDays = s.getAvgCycleTimeDays();
        r.scopeCreepRatePct = s.getScopeCreepRatePct();
        r.blockerResolutionDays = s.getBlockerResolutionDays();
        r.tasksReworked = s.getTasksReworked();
        r.tasksCompleted = s.getTasksCompleted();
        r.totalHoursWorked = s.getTotalHoursWorked();
        r.calculatedAt = s.getCalculatedAt();
        return r;
    }
}
