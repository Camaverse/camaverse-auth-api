class ApiResponse {

    constructor (status = 'Unknown') {
        this.status  = status;
    }
}

class SuccessResponse extends ApiResponse {
    constructor (data){
        super()
        this.status = 'success'
        this.data = data;
    }
}

module.exports = {
    SuccessResponse
};