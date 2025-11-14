package com.stg.sikboo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SikbooApplication {

	public static void main(String[] args) {
		SpringApplication.run(SikbooApplication.class, args);
	}

}
