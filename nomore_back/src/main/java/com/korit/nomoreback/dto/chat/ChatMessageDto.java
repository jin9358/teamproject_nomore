package com.korit.nomoreback.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Integer chatId;
    private String chattingContent;
    private String userNickName;
    private Integer moimId;
    private LocalDateTime chattedAt;

    private List<String> imagePaths;

}
