package com.springboot.MyTodoList.dto;

import java.math.BigDecimal;

public class TimeToActionDto {

    private String email;
    private int tasksMeasured;
    private BigDecimal avgTimeToActionDays;

    public TimeToActionDto(String email, int tasksMeasured, BigDecimal avgTimeToActionDays) {
        this.email = email;
        this.tasksMeasured = tasksMeasured;
        this.avgTimeToActionDays = avgTimeToActionDays;
    }

    public String getEmail() { return email; }
    public int getTasksMeasured() { return tasksMeasured; }
    public BigDecimal getAvgTimeToActionDays() { return avgTimeToActionDays; }
}
