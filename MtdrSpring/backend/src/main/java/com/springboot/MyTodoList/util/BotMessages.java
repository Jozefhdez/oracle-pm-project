package com.springboot.MyTodoList.util;

public enum BotMessages {
	
	HELLO_MYTODO_BOT("Oracle Project Manager\n\nType /help to see available commands.\nFirst time? Link your account with /link &lt;code&gt;."),
	BOT_REGISTERED_STARTED("Bot registered and started successfully."),
	ITEM_DONE("Done. Use /todolist to go back or /start for the main screen."),
	ITEM_UNDONE("Marked as not done. Use /todolist to go back or /start for the main screen."),
	ITEM_DELETED("Task deleted. Use /todolist to go back or /start for the main screen."),
	TYPE_NEW_TODO_ITEM("Type the task title and press send."),
	NEW_ITEM_ADDED("Task added. Use /todolist to go back or /start for the main screen."),
	BYE("Keyboard hidden. Use /start to bring it back.");

	private String message;

	BotMessages(String enumMessage) {
		this.message = enumMessage;
	}

	public String getMessage() {
		return message;
	}

}
