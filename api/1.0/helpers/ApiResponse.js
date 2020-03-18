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

const isExpressReq = (req) => req && req.constructor && req.constructor.name === 'IncomingMessage';
const isExpressRes = (res) => res && res.constructor && res.constructor.name === 'ServerResponse';

const respond  = (err, docs, res)  => {
    let response;
    if (err) response = new ErrorResponse(err.message, docs);
    else response = new SuccessResponse(docs);

    if (err && isExpressRes(res)) {
        res.status(500).json(response)
    } else if (err && !isExpressRes(res)) {
        res(response)
    } else if (isExpressRes(res)) {
        res.status(200).json(response)
    } else if (res) {
        res(err, response)
    } else {
        console.log(response)
    }
}

module.exports = {
    isExpressReq,
    respond
};