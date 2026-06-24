package com.intern.cnpm8;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CNPM8Application {
    public static void main(String[] args) {
        SpringApplication.run(CNPM8Application.class, args);
    }
}