class ApiReponse {
    constructor({
        statusCode = 200,
        success = true,
        data = null,
        message = 'Success',
        errors = null
    }) {
        this.statusCode = statusCode;
        this.success = success;
        this.data = data;
        this.message = message;
        this.errors = errors;
    }
}

export { ApiReponse };