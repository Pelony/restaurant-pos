package com.pos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private UUID id;
    private UUID tableId;
    private String tableNumber;
    private String status;
    private BigDecimal total;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private UUID userId;
    private String userName;
    private List<OrderItemDTO> items;
}