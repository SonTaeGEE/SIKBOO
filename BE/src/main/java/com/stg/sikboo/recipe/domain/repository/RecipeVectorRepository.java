package com.stg.sikboo.recipe.domain.repository;

import com.stg.sikboo.recipe.domain.RecipeVector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecipeVectorRepository extends JpaRepository<RecipeVector, Long> {

    // rcp_seq TEXT 이므로 String
    boolean existsByRcpSeq(String rcpSeq);

    /**
     * embedding 컬럼은 VECTOR(1536)이므로
     * 자바에서 문자열 "[0.1,0.2,...]" 로 만들어서 넘기고
     * 여기서 CAST(:embedding AS vector(1536)) 로 캐스팅해서 INSERT 한다.
     *
     * ⚠️ 주의: JPA 파서가 :embedding::vector 를
     *   'embedding::vector' 라는 파라미터 이름으로 인식해서
     *   반드시 CAST 문법을 써야 한다.
     */
    @Modifying
    @Query(value = """
        INSERT INTO recipe_vector (title, ingredients, steps, embedding, rcp_seq, created_at)
        VALUES (:title, :ingredients, :steps, CAST(:embedding AS vector(1536)), :rcpSeq, NOW())
        """, nativeQuery = true)
    void insertWithEmbedding(
            @Param("title") String title,
            @Param("ingredients") String ingredients,
            @Param("steps") String steps,
            @Param("embedding") String embedding, // "[...]" 형식 문자열
            @Param("rcpSeq") String rcpSeq
    );

    /**
     * 코사인 유사도 기반 K개 검색 예시.
     * 나중에 RAG 검색할 때 사용할 수 있다.
     */
    @Query(value = """
        SELECT 
            recipe_vector_id AS id,
            title            AS title,
            ingredients      AS ingredients,
            steps            AS steps,
            rcp_seq          AS rcpSeq,
            1 - (embedding <=> CAST(:queryEmbedding AS vector(1536))) AS similarity
        FROM recipe_vector
        ORDER BY embedding <-> CAST(:queryEmbedding AS vector(1536))
        LIMIT :topK
        """, nativeQuery = true)
    List<SimilarRecipeRow> searchByEmbedding(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("topK") int topK
    );

    /**
     * nativeQuery 결과를 매핑할 Projection 인터페이스
     * - 위 쿼리에서 AS 로 준 별칭(id, title, ingredients, steps, rcpSeq, similarity) 과
     *   getter 이름이 매칭된다.
     */
    interface SimilarRecipeRow {
        Long getId();
        String getTitle();
        String getIngredients();
        String getSteps();
        String getRcpSeq();    // rcp_seq TEXT → String
        Double getSimilarity();
    }
}
