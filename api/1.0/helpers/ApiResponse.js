class ApiResponse {
    constructor (status = 'Unknown') {
        this.status  = status
    }
}

class ErrorResponse extends ApiResponse{
    constructor (error, data){
        super()
        this.status = 'error'
        this.error = error
        if (data) this.data = data
    }
}

class SuccessResponse extends ApiResponse {
    constructor (data){
        super()
        this.status = 'success'
        this.data = data
    }
}

module.exports = {
    success: SuccessResponse,
    error: ErrorResponse
};