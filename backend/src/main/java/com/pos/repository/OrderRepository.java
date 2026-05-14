package com.pos.repository;

import com.pos.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByTenantIdAndCreatedAtBetween(UUID tenantId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.tenant.id = :tenantId AND o.createdAt BETWEEN :start AND :end")
    java.math.BigDecimal sumTotalByTenantAndDateRange(UUID tenantId, LocalDateTime start, LocalDateTime end);
}