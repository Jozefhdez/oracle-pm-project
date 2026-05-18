package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.config.BotProps;
import com.springboot.MyTodoList.model.ChangeSource;
import com.springboot.MyTodoList.model.Project;
import com.springboot.MyTodoList.model.ProjectMember;
import com.springboot.MyTodoList.model.Sprint;
import com.springboot.MyTodoList.model.SprintStatus;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.model.TaskPriority;
import com.springboot.MyTodoList.model.TaskStatus;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.ProjectMemberRepository;
import com.springboot.MyTodoList.repository.ProjectRepository;
import com.springboot.MyTodoList.repository.SprintRepository;
import com.springboot.MyTodoList.repository.TaskWorkLogRepository;
import com.springboot.MyTodoList.repository.UserRepository;
import com.springboot.MyTodoList.service.GeminiService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.telegram.TelegramLinkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.chat.Chat;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ToDoItemBotControllerTest {

    private static final long CHAT_ID = 12345L;

    @Mock
    private TelegramClient telegramClient;

    @Mock
    private ToDoItemService toDoItemService;

    @Mock
    private GeminiService geminiService;

    @Mock
    private TelegramLinkService telegramLinkService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskWorkLogRepository taskWorkLogRepository;

    @Mock
    private SprintRepository sprintRepository;

    @Mock
    private BotProps botProps;

    @Captor
    private ArgumentCaptor<SendMessage> sendMessageCaptor;

    private ToDoItemBotController controller;
    private User user;
    private Project project;
    private ProjectMember projectMember;
    private Sprint sprint;

    @BeforeEach
    void setUp() {
        controller = new ToDoItemBotController(
            botProps,
            toDoItemService,
            geminiService,
            telegramLinkService,
            userRepository,
            projectMemberRepository,
            projectRepository,
            taskWorkLogRepository,
            sprintRepository,
            telegramClient
        );

        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("ana@example.com");
        user.setTelegramChatId(String.valueOf(CHAT_ID));

        project = new Project();
        project.setId(UUID.randomUUID());
        project.setName("Oracle PM");

        projectMember = new ProjectMember();
        projectMember.setId(UUID.randomUUID());
        projectMember.setUser(user);
        projectMember.setProject(project);

        sprint = new Sprint();
        sprint.setId(UUID.randomUUID());
        sprint.setName("Sprint 1");
        sprint.setProject(project);
        sprint.setStatus(SprintStatus.ACTIVE);
        sprint.setStartDate(LocalDate.now().minusDays(2));
        sprint.setEndDate(LocalDate.now().plusDays(5));
    }

    @Test
    void createTaskThroughTelegramBot() throws Exception {
        when(userRepository.findByTelegramChatId(String.valueOf(CHAT_ID))).thenReturn(Optional.of(user));
        when(projectMemberRepository.findByUser_Id(user.getId())).thenReturn(List.of(projectMember));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(sprintRepository.findByProject_IdAndStatus(project.getId(), SprintStatus.ACTIVE)).thenReturn(List.of(sprint));

        controller.consume(updateWithText("/create Prepare demo | HIGH"));

        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(toDoItemService).addToDoItem(taskCaptor.capture(), any(User.class), any(ChangeSource.class));

        Task savedTask = taskCaptor.getValue();
        assertEquals("Prepare demo", savedTask.getTitle());
        assertEquals(TaskPriority.HIGH, savedTask.getPriority());
        assertEquals(TaskStatus.TODO, savedTask.getStatus());
        assertEquals(project, savedTask.getProject());
        assertEquals(sprint, savedTask.getSprint());
        assertEquals(user, savedTask.getCreatedBy());

        verify(telegramClient).execute(sendMessageCaptor.capture());
        SendMessage response = sendMessageCaptor.getValue();
        assertEquals(String.valueOf(CHAT_ID), response.getChatId());
        assertTrue(response.getText().contains("Task created in Sprint 1"));
        assertTrue(response.getText().contains("Prepare demo"));
        assertTrue(response.getText().contains("HIGH"));
    }

    @Test
    void viewCompletedTasksOfSprint() throws Exception {
        Task doneTask = task("Deploy service", TaskStatus.DONE, sprint, user);
        Task todoTask = task("Fix login", TaskStatus.TODO, sprint, user);
        Task anotherDoneTask = task("Write docs", TaskStatus.DONE, sprint, user);

        when(userRepository.findByTelegramChatId(String.valueOf(CHAT_ID))).thenReturn(Optional.of(user));
        when(projectMemberRepository.findByUser_Id(user.getId())).thenReturn(List.of(projectMember));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(sprintRepository.findByProject_Id(project.getId())).thenReturn(List.of(sprint));
        when(toDoItemService.findByProjectId(project.getId())).thenReturn(List.of(doneTask, todoTask, anotherDoneTask));
        when(toDoItemService.findBySprintId(sprint.getId())).thenReturn(List.of(doneTask, todoTask, anotherDoneTask));

        controller.consume(updateWithText("/status Sprint 1"));

        verify(sprintRepository).findByProject_Id(project.getId());
        verify(toDoItemService).findBySprintId(sprint.getId());
        verify(telegramClient).execute(sendMessageCaptor.capture());

        SendMessage response = sendMessageCaptor.getValue();
        assertEquals(String.valueOf(CHAT_ID), response.getChatId());
        assertTrue(response.getText().contains("Sprint 1"));
        assertTrue(response.getText().contains("Done         2"));
    }

    @Test
    void viewCompletedTasksOfUserInSprint() throws Exception {
        Task userDoneTask = task("Create dashboard", TaskStatus.DONE, sprint, user);
        Task userTodoTask = task("Polish buttons", TaskStatus.TODO, sprint, user);

        when(userRepository.findByTelegramChatId(String.valueOf(CHAT_ID))).thenReturn(Optional.of(user));
        when(projectMemberRepository.findByUser_Id(user.getId())).thenReturn(List.of(projectMember));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(sprintRepository.findByProject_Id(project.getId())).thenReturn(List.of(sprint));
        when(toDoItemService.findByProjectId(project.getId())).thenReturn(List.of(userDoneTask, userTodoTask));
        when(toDoItemService.findBySprintId(sprint.getId())).thenReturn(List.of(userDoneTask, userTodoTask));

        controller.consume(updateWithText("/status Sprint 1"));

        verify(userRepository).findByTelegramChatId(String.valueOf(CHAT_ID));
        verify(projectMemberRepository).findByUser_Id(user.getId());
        verify(toDoItemService).findBySprintId(sprint.getId());
        verify(telegramClient).execute(sendMessageCaptor.capture());

        SendMessage response = sendMessageCaptor.getValue();
        assertEquals(String.valueOf(CHAT_ID), response.getChatId());
        assertTrue(response.getText().contains("Sprint 1"));
        assertTrue(response.getText().contains("Done         1"));
    }

    @Test
    void helpCommandSendsHelpMessage() throws Exception {
        controller.consume(updateWithText("/help"));

        verify(telegramClient).execute(sendMessageCaptor.capture());
        SendMessage response = sendMessageCaptor.getValue();

        assertEquals(String.valueOf(CHAT_ID), response.getChatId());
        assertTrue(response.getText().contains("<b>Commands</b>"));
        assertTrue(response.getText().contains("/create"));
        assertTrue(response.getText().contains("/status"));
        verifyNoInteractions(toDoItemService);
    }

    @Test
    void invalidOrEmptyUpdateIsIgnored() throws Exception {
        Update emptyUpdate = new Update();

        controller.consume(emptyUpdate);

        verify(telegramClient, never()).execute(any(SendMessage.class));
        verifyNoInteractions(toDoItemService);
        verifyNoInteractions(userRepository);
    }

    private Update updateWithText(String text) {
        Chat chat = new Chat(CHAT_ID, "private");

        Message message = new Message();
        message.setText(text);
        message.setChat(chat);

        Update update = new Update();
        update.setMessage(message);
        return update;
    }

    private Task task(String title, TaskStatus status, Sprint sprint, User assignee) {
        Task task = new Task();
        task.setId(UUID.randomUUID());
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(TaskPriority.MEDIUM);
        task.setProject(project);
        task.setSprint(sprint);
        task.setAssignee(assignee);
        task.setCreatedBy(assignee);
        return task;
    }
}
