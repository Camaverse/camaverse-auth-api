module.exports = {
    date (start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    },
    number (max = 100000, min = 0) {
        return (Math.floor(Math.random() * max) + min);
    }
}