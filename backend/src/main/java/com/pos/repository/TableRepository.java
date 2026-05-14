package com.pos.repository;

import com.pos.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface TableRepository extends JpaRepository<TableEntity, UUID> {
}