//Image based on gender
const MALE_IMGS = [3, 4, 6, 7, 8, 11, 12, 13, 14, 15, 17, 18, 33, 50, 52, 53, 54, 55, 56, 57, 59, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70];
const FEMALE_IMGS = [1, 5, 9, 10, 16, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 32, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49];

export function pickAvatarUrl(seed, gender) {
    const pool = gender === "Male" ? MALE_IMGS : FEMALE_IMGS;
    let hash = 0; 

    for (let i = 0; i <seed.length; i++) {
        hash = (hash *31 + seed.charCodeAt(i) ) >>> 0;
    }

    const img = pool[hash % pool.length];
    return `https://i.pravatar.cc/300?img=${img}`;
}