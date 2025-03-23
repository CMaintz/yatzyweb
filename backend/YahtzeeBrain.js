class YahtzeeBrain {
    static calculateScore(dice, category) {
        const diceValues = dice.map(die => die.value);
        const counts = Array(6).fill(0);
        
        diceValues.forEach(value => counts[value - 1]++);
        switch (category) {
            case "1-s":
            case "2-s":
            case "3-s":
            case "4-s":
            case "5-s":
            case "6-s":
                const target = parseInt(category[0]);
                return counts[target - 1] * target;

            case "one-pair":
                return YahtzeeBrain.findHighestOfAKind(counts, 2);

            case "two-pairs":
                return YahtzeeBrain.findTwoPairs(counts);

            case "three-same":
                return YahtzeeBrain.findHighestOfAKind(counts, 3);

            case "four-same":
                return YahtzeeBrain.findHighestOfAKind(counts, 4);

            case "full-house":
                return YahtzeeBrain.calculateFullHouse(counts);

            case "small-straight":
                return diceValues.sort().join('') === '12345' ? 15 : 0;

            case "large-straight":
                return diceValues.sort().join('') === '23456' ? 20 : 0;

            case "chance":
                return diceValues.reduce((sum, val) => sum + val, 0);

            case "yatzy":
                return counts.includes(5) ? 50 : 0;

            default:
                throw new Error(`Unknown category: ${category}`);
        }
    }

    static findHighestOfAKind(counts, n) {
        for (let i = counts.length - 1; i >= 0; i--) {
            if (counts[i] >= n) {
                return (i + 1) * n;
            }
        }
        return 0;
    }

    static findTwoPairs(counts) {
        let pairs = [];
        for (let i = counts.length - 1; i >= 0; i--) {
            if (counts[i] >= 2) {
                pairs.push((i + 1) * 2);
                if (pairs.length === 2) {
                    return pairs[0] + pairs[1];
                }
            }
        }
        return 0;
    }

    static calculateFullHouse(counts) {
        let three = 0;
        let two = 0;
        for (let i = counts.length - 1; i >= 0; i--) {
            if (counts[i] === 3) three = (i + 1) * 3;
            if (counts[i] === 2) two = (i + 1) * 2;
        }
        return three && two ? three + two : 0;
    }
}

module.exports = YahtzeeBrain;
