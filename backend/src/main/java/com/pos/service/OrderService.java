package com.pos.service;

import com.pos.dto.OrderDTO;
import com.pos.dto.OrderItemDTO;
import com.pos.entity.*;
import com.pos.repository.OrderRepository;
import com.pos.repository.OrderItemRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.TableRepository;
import com.pos.repository.UserRepository;
import com.pos.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final TableRepository tableRepository;
    private final UserRepository userRepository;

    public List<OrderDTO> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return orderRepository.findAll().stream()
                .filter(o -> o.getTenant().getId().equals(tenantId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO getById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        validateTenant(order.getTenant().getId());
        return toDTO(order);
    }

    @Transactional
    public OrderDTO create(OrderDTO dto, UUID userId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = Tenant.builder().id(tenantId).build();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TableEntity table = null;
        if (dto.getTableId() != null) {
            table = tableRepository.findById(dto.getTableId())
                    .orElseThrow(() -> new RuntimeException("Table not found"));
            validateTenant(table.getTenant().getId());
            table.setStatus("occupied");
            tableRepository.save(table);
        }

        Order order = Order.builder()
                .tenant(tenant)
                .tableEntity(table)
                .user(user)
                .status("pending")
                .notes(dto.getNotes())
                .build();

        if (dto.getItems() != null) {
            for (OrderItemDTO itemDTO : dto.getItems()) {
                Product product = productRepository.findById(itemDTO.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + itemDTO.getProductId()));

                OrderItem item = OrderItem.builder()
                        .product(product)
                        .quantity(itemDTO.getQuantity())
                        .unitPrice(product.getPrice())
                        .subtotal(product.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())))
                        .notes(itemDTO.getNotes())
                        .build();
                order.addItem(item);
            }
            order.calculateTotal();
        }

        order = orderRepository.save(order);
        return toDTO(order);
    }

    public OrderDTO updateStatus(UUID id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        validateTenant(order.getTenant().getId());

        order.setStatus(status);
        if ("completed".equals(status)) {
            order.setCompletedAt(LocalDateTime.now());
            if (order.getTableEntity() != null) {
                order.getTableEntity().setStatus("free");
                tableRepository.save(order.getTableEntity());
            }
        }
        order = orderRepository.save(order);
        return toDTO(order);
    }

    private void validateTenant(UUID orderTenantId) {
        UUID currentTenantId = TenantContext.getCurrentTenant();
        if (!currentTenantId.equals(orderTenantId)) {
            throw new RuntimeException("Access denied");
        }
    }

    private OrderDTO toDTO(Order order) {
        List<OrderItemDTO> items = order.getItems().stream()
                .map(item -> OrderItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .notes(item.getNotes())
                        .build())
                .collect(Collectors.toList());

        return OrderDTO.builder()
                .id(order.getId())
                .tableId(order.getTableEntity() != null ? order.getTableEntity().getId() : null)
                .tableNumber(order.getTableEntity() != null ? order.getTableEntity().getNumber() : null)
                .status(order.getStatus())
                .total(order.getTotal())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .completedAt(order.getCompletedAt())
                .userId(order.getUser().getId())
                .userName(order.getUser().getName())
                .items(items)
                .build();
    }
}