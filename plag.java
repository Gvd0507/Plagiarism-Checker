import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

interface SimilarityChecker {
    double calculateSimilarity(Set<String> set1, Set<String> set2);
}

abstract class FileProcessor {
    abstract List<String> readFile(String filename) throws IOException;

    void displayMessage(String msg) {
        System.out.println(msg);
    }
}

public class plag extends FileProcessor implements SimilarityChecker {

    private String file1;
    private String file2;

    public plag(String file1, String file2) {
        this.file1 = file1;
        this.file2 = file2;
    }

    public plag() {
        this("original.txt", "student.txt");
    }

    @Override
    public List<String> readFile(String filename) throws IOException {
        List<String> words = new ArrayList<>();
        BufferedReader br = new BufferedReader(new FileReader(filename));
        String line;
        while ((line = br.readLine()) != null) {
            line = line.toLowerCase().replaceAll("[^a-zA-Z ]", ""); 
            words.addAll(Arrays.asList(line.split("\\s+")));
        }
        br.close();
        return words;
    }

    @Override
    public double calculateSimilarity(Set<String> set1, Set<String> set2) {
        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);
        return (double) intersection.size() / union.size();
    }

    public void checkPlagiarism() {
        try {
            List<String> file1Words = readFile(file1);
            List<String> file2Words = readFile(file2);

            Set<String> file1Set = new HashSet<>(file1Words);
            Set<String> file2Set = new HashSet<>(file2Words);

            double similarity = calculateSimilarity(file1Set, file2Set) * 100;
            displayMessage(String.format("Plagiarism detected: %.2f%% similarity", similarity));
        } catch (IOException e) {
            displayMessage("Error reading files: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        plag checker;

        if (args.length == 2) {
            checker = new plag(args[0], args[1]);
        } else {
            checker = new plag();
        }
        checker.checkPlagiarism();
    }
}
