package com.springboot.MyTodoList.dto;

import java.util.UUID;

public class AgingWipItemDto {

    private UUID taskId;
    private String title;
    private String assigneeEmail;
    private double daysInProgress;
    private String wipHealth;

    public AgingWipItemDto(UUID taskId, String title, String assigneeEmail, double daysInProgress, String wipHealth) {
        this.taskId = taskId;
        this.title = title;
        this.assigneeEmail = assigneeEmail;
        this.daysInProgress = daysInProgress;
        this.wipHealth = wipHealth;
    }

    public UUID getTaskId() { return taskId; }
    public String getTitle() { return title; }
    public String getAssigneeEmail() { return assigneeEmail; }
    public double getDaysInProgress() { return daysInProgress; }
    public String getWipHealth() { return wipHealth; }
}
