const handleErrorOnNoRecords = (res, next) => {
    if (!res) return next(new Error('not found!'));
    return next();
}

const errorOnNoRecords = (schema) => {
    schema.post('findOne', handleErrorOnNoRecords);
    schema.post('findOneAndUpdate', handleErrorOnNoRecords);
}

module.exports = {
    errorOnNoRecords
}