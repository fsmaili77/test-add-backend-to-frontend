using System.Collections.Generic;
using LegalAnalyzer.Domain.Entities;
using System.Threading.Tasks;


namespace LegalAnalyzer.Domain.Interfaces
{
    public interface IRepository<T> where T : class
    {
        IEnumerable<T> GetAll();
        T GetById(int id);
        void Add(T entity);
        void Update(T entity);
        void Delete(int id);
        void SaveChanges();
    }
}