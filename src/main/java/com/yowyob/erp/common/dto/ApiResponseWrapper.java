package com.yowyob.erp.common.dto;

import lombok.Data;

@Data
public class ApiResponseWrapper<T> {
    private boolean success;
    private T data;
    private String message;

    public static <T> ApiResponseWrapper<T> success(T data) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(true);
        response.setData(data);
        response.setMessage("Opération réussie");
        return response;
    }

    public static <T> ApiResponseWrapper<T> success(T data, String message) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(true);
        response.setData(data);
        response.setMessage(message);
        return response;
    }

    public static <T> ApiResponseWrapper<T> error(String message) {
        ApiResponseWrapper<T> response = new ApiResponseWrapper<>();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}