package com.springboot.MyTodoList.dto;

import java.util.UUID;

public class BlockedTaskItemDto {

    private UUID taskId;
    private String title;
    private String priority;
    private String assigneeEmail;
    private double daysBlocked;
    private int reworkCount;

    public BlockedTaskItemDto(UUID taskId, String title, String priority, String assigneeEmail, double daysBlocked, int reworkCount) {
        this.taskId = taskId;
        this.title = title;
        this.priority = priority;
        this.assigneeEmail = assigneeEmail;
        this.daysBlocked = daysBlocked;
        this.reworkCount = reworkCount;
    }

    public UUID getTaskId() { return taskId; }
    public String getTitle() { return title; }
    public String getPriority() { return priority; }
    public String getAssigneeEmail() { return assigneeEmail; }
    public double getDaysBlocked() { return daysBlocked; }
    public int getReworkCount() { return reworkCount; }
}
