package com.springboot.MyTodoList.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CycleTimeTrendPointDto {

    private String sprintName;
    private LocalDate startDate;
    private BigDecimal avgCycleTimeDays;
    private int tasksCompleted;
    private BigDecimal tasksPerDay;

    public CycleTimeTrendPointDto(String sprintName, LocalDate startDate, BigDecimal avgCycleTimeDays, int tasksCompleted, BigDecimal tasksPerDay) {
        this.sprintName = sprintName;
        this.startDate = startDate;
        this.avgCycleTimeDays = avgCycleTimeDays;
        this.tasksCompleted = tasksCompleted;
        this.tasksPerDay = tasksPerDay;
    }

    public String getSprintName() { return sprintName; }
    public LocalDate getStartDate() { return startDate; }
    public BigDecimal getAvgCycleTimeDays() { return avgCycleTimeDays; }
    public int getTasksCompleted() { return tasksCompleted; }
    public BigDecimal getTasksPerDay() { return tasksPerDay; }
}
