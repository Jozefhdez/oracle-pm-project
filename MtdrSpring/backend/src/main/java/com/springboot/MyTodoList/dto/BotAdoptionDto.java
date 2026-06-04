package com.springboot.MyTodoList.dto;

import java.math.BigDecimal;

public class BotAdoptionDto {

    private String email;
    private int webUpdates;
    private int botUpdates;
    private int totalUpdates;
    private BigDecimal botAdoptionPct;

    public BotAdoptionDto(String email, int webUpdates, int botUpdates, int totalUpdates, BigDecimal botAdoptionPct) {
        this.email = email;
        this.webUpdates = webUpdates;
        this.botUpdates = botUpdates;
        this.totalUpdates = totalUpdates;
        this.botAdoptionPct = botAdoptionPct;
    }

    public String getEmail() { return email; }
    public int getWebUpdates() { return webUpdates; }
    public int getBotUpdates() { return botUpdates; }
    public int getTotalUpdates() { return totalUpdates; }
    public BigDecimal getBotAdoptionPct() { return botAdoptionPct; }
}
